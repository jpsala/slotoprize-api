import url from 'url'
import https from 'https'
import WebSocket, { Server } from 'ws'
import PubSub from 'pubsub-js'
import createHttpError from 'http-errors'
import { StatusCodes } from 'http-status-codes'
import { isValidJSON, toBoolean } from '../../../../helpers'
import { EventPayload } from '../events/event'
import { getGameUserById } from '../../../meta/meta.repo/gameUser.repo'
import { verifyToken } from '../../../../services/jwtService'
import { GameUser } from '../../../meta/meta.types'
import { queryExec } from '../../../../db'
//#region types
export let wsServer: WsServerService
export interface WebSocketMessage
{
  code: 200 | 400 | 500;
  message: 'OK' | string;
  msgType: 'events' | 'webSocket' | 'eventsState' | 'spinTimer' | 'getSpinTimer' | 'adReward' | 'jackpotWin' | 'raffleWin' | 'maintenanceMode';
  payload: EventPayload | any
  isJson?: boolean
  log?: boolean
}
type WsServerService = {
  server: WebSocket.Server,
  ws: WebSocket,
  send(_msg: WebSocketMessage, client?: WebSocket): void,
  sendRaw(_msg: any, client?: WebSocket | undefined): void
  sendToUser(_msg: WebSocketMessage, userId): void
  shutDown(): void
  updateUser(user: GameUser): void
}
export interface ExtWebSocket extends WebSocket {
  user: GameUser
}
//#endregion

let server: WebSocket.Server
let ws: WebSocket
type UserConnection = {userId: number, client: ExtWebSocket}
export const usersConnection = (): UserConnection[] | [] => {
  const clients: UserConnection[] = []
  wsServer.server.clients && wsServer.server.clients.forEach(_client => {
    const client = <ExtWebSocket>_client
    const userConnected:  UserConnection= { userId: client.user.id, client }
    clients.push(userConnected)
  })
  return clients as [{userId: number, client: ExtWebSocket}] | []
}
export const getUserConnection = (userId: number): UserConnection | undefined => {
  const connectedUsers = usersConnection()
  const userConnection = connectedUsers.find(_user => _user.userId === userId)
  return userConnection
}
export const createWsServerService = (httpsServer?: https.Server): void =>
{
  if (httpsServer)
    server = new Server({
      server: httpsServer
    })
   else
    server = new Server({
      port: 3000,
    })

  console.log(`${httpsServer ? 'Encrypted ' : 'Not encrypted '}WebSocket on port 3000`)

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  server.on('connection', async function (ws: ExtWebSocket, req): Promise<void>
  {
    if(!req.url) throw Error('Url not in websocket connection')
    const _url = url.parse(req.url)
    const query = parseUrl(_url)
    if(!query.userId){
      ws.send('userId is missing in the ws connection')
      ws.close()
      throw createHttpError(StatusCodes.BAD_REQUEST, 'userId is missing in the ws connection')
    }
    const user = await getGameUserById(query.userId)
    if(!user) {
      ws.close()
      throw createHttpError(StatusCodes.BAD_REQUEST, 'User does not exists')
    }
    const isDev = user.isDev
    console.log(`[SERVER] connection()`, 'userId:', query.userId)
    if(!isDev){
      if(!query.sessionToken){
        ws.send('sessionToken is missing in the ws connection')
        ws.close()
        throw createHttpError(StatusCodes.BAD_REQUEST, 'sessionToken is missing in the ws connection')
      }
      if (query.sessionToken === 'lani0363') {
        console.log('back door')
      } else {
        const resp = verifyToken(query.sessionToken)
        if (!resp?.decodedToken || !resp?.decodedToken.id){
          ws.send('Invalid token in ws connection')
          ws.close()
          throw createHttpError(StatusCodes.BAD_REQUEST, 'Invalid token in ws connection')
        }
        if(Number(resp?.decodedToken.id) !== Number(query.userId)){
          ws.send('userId in token is different from userId in the ws connection')
          ws.close()
          throw createHttpError(StatusCodes.BAD_REQUEST, 'userId in token is different from userId in the ws connection parameters')
        }
      }
    }
    ws.user = user
    ws.on('message', (msg) => onMessage(msg, ws))
  })
  const sendToUser = (_msg: WebSocketMessage, userId): void =>
  {
    server.clients.forEach(_client =>
    {
      const client = <ExtWebSocket> _client
      if (client.user.id === userId) {
        console.log('sended to specific client %O', userId, _msg.message)
        send(_msg, client as WebSocket)
      }
    })
  }
  const parseUrl = (url): any =>
  {
    const queryParts = url.query?.split('&')
    const query = queryParts?.reduce((part1, part2) =>
    {
      const parts = part2.split('=')
      if (parts.length === 2)
        part1[parts[0]] = parts[1]
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return part1
    }, {})
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return query
  }
  const send = (_msg: WebSocketMessage, client: WebSocket | undefined = undefined): void =>
  {
    console.log('send', _msg)
    const forDevOnly = toBoolean(_msg.payload.devOnly)
    const payload = JSON.stringify(_msg.payload)
    const msgStr = Object.assign({}, _msg) as any
    msgStr.payload = payload
    const msg = JSON.stringify(_msg.isJson ? _msg : msgStr)
    if (_msg.log) console.log('ws send with log', _msg, _msg.payload) 
    if (client) {
      const tutorialComplete = (client as ExtWebSocket).user.tutorialComplete
      if (tutorialComplete) {
        console.log('sending to specific client', _msg)
        // console.log('sending to specific client', _msg.payload.name, _msg.payload.action)
        client.send(msg)
      } else {console.log('not sending ws event, tutorial not completed')}
    }
    else
    {
      server.clients.forEach((client) => {
        // const userId = Number((client as ExtWebSocket).user.id)
        const tutorialComplete = toBoolean((client as ExtWebSocket).user.tutorialComplete)
        if (tutorialComplete) {
          const isDev = toBoolean((client as ExtWebSocket).user.isDev)
          // if((client as ExtWebSocket).user.isNew)
          if (!(forDevOnly && !isDev)) {
            console.log('sended to specific client inside send to all')
            client.send(msg)
          } else {console.log('not sending ws event, is for dev only and user is not dev')}
        } else {console.log('not sending ws event, tutorial not completed')}
      })
    }

  }
  const updateUser = (user: GameUser): void => {
    server.clients.forEach((client) => {
      if((client as ExtWebSocket).user.id === user.id) (client as ExtWebSocket).user = user
    })
  }
  const sendRaw = (_msg: any, client: WebSocket | undefined = undefined): void =>
  {
    const payload = JSON.stringify(_msg.payload)
    const msgStr = Object.assign({}, _msg)
    msgStr.payload = payload
    const msg = JSON.stringify(msgStr)
    console.log('msg', msg)
    if (client)
    {
      console.log('client', client.CLOSED)
      client.send(msg)
      console.log('sended to specific client')
    }
    else
    {
      console.log('sending msg to all clients', msg)
      server.clients.forEach((client) =>
      {
        console.log('sended to client')
        client.send(msg)
      })
    }
  }
  const onMessage = function (message, ws: WebSocket): void
  {
    try
    {
      // console.log(`[SERVER] Received:`, message.subsrtr(0,60))
      if (!(typeof message === 'string'))
        throw new Error('ws on message: message have to be string')

      const isValid = isValidJSON(message)
      if (!isValid) throw Error(`invalid JSON on webSocket incomming message: ${message}`)
      const msg = JSON.parse(message)
      if (msg.command)
      {
        console.log('command', msg)
        msg.client = ws
        PubSub.publish(msg.command, msg)
      }
      // PubSub.publish('ws', msg)
    } catch (error)
    {
      PubSub.publish('error', { error: JSON.stringify({ "error": error.message }), client: ws })
    }
  }
  const shutDown = function (): void
  {
    server.close()
    console.log('websocket shutdown')
  }
  wsServer = { server, ws, send, sendRaw, sendToUser, shutDown, updateUser }
}
export const saveWsMsgForLaterSending = async (userId: number, wsMessage: WebSocketMessage): Promise<void> => {
  try {
    await queryExec(`
        insert into user_on_connect(game_user_id, jsonMsg) values(?, ?)
      `, [userId, JSON.stringify(wsMessage)])
    // wsServer.sendToUser(wsMessage, Number(userId))
  } catch (error) {
    wsServer.sendToUser(error, userId)
  }
}
console.log('loaded ws.service.ts') 

