import url from 'url'
import WebSocket, { Server } from 'ws'
import PubSub from 'pubsub-js'
import { isValidJSON } from '../../../../helpers'
import { EventPayload } from '../events/event'
//#region types
type Subscription = { message: string, cb: () => void }

/*
public class EventData
{
    public string action;
    public strin name;
    public string popupMessage;
    public string popupTextureUrl;
    public string notificationMessage;
    public string notificationTextureUrl;
    public SkinData skin;
    public bool devOnly;
} */
export interface WebSocketMessage
{
  code: 200 | 400 | 500;
  message: 'OK' | string;
  msgType: 'events' | 'webSocket' | 'eventsState' | 'spinTimer' | 'getSpinTimer';
  payload: EventPayload | any
}
type WsServerService = {
  server: WebSocket.Server,
  ws: WebSocket,
  send(_msg: WebSocketMessage, client?: WebSocket): void,
  sendRaw(_msg: any, client?: WebSocket | undefined): void
  sendToUser(_msg: WebSocketMessage, userId): void
  shutDown(): void
}
type MessageForEmit = {
  command: string;
}
//#endregion
let server: WebSocket.Server
let ws: WebSocket

export interface ExtWebSocket extends WebSocket {
  userId: number; // your custom property
}
const createWsServerService = (): WsServerService =>
{
  server = new Server({
    port: 8890,
  })
  server.on('connection', function (ws: ExtWebSocket, req)
  {
    if(!req.url) throw Error('Url not in websocket connection')
    const _url = url.parse(req.url)
    const userId = Number(_url.query)
    console.log(`[SERVER] connection()`, 'userId:', userId)
    if(isNaN(userId)) throw Error('Url not in websocket connection')
    ws.userId = userId
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
  const send = (_msg: WebSocketMessage, client: WebSocket | undefined = undefined): void =>
  {
    // @TODO ver abajo
    const payload = JSON.stringify(_msg.payload)
    const msgStr = Object.assign({}, _msg) as any
    msgStr.payload = payload
    const msg = JSON.stringify(msgStr)
    // console.log('msg', msg)
    if (client)

      // console.log('sending to specific client', _msg.payload.name, _msg.payload.action)
      client.send(msg)

    else

      // console.log('sending msg to all clients', _msg.payload.name, _msg.payload.action)
      server.clients.forEach((client) =>
      {
        console.log('sended to specific client inside send to all')
        client.send(msg)
      })

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
  return { server, ws, send, sendRaw, sendToUser, shutDown }
}
console.log('ws.ts')
export let wsServer: WsServerService
if (process.env.NODE_ENV !== 'testing')
{
  console.log('ws server started at port 8890...')
  wsServer = createWsServerService()
} else
{
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  wsServer = { send: (_msg: WebSocketMessage, client?: WebSocket | undefined) => { console.log('ws mock send') } } as WsServerService
}



// client test:

// const client = new WebSocket('ws://127.0.0.1:8890/ws/chat')
// const client = new WebSocket('ws://slotoprizes.tagadagames.com:8890/ws/chat')
// client.on('open', function () {
//   console.log(`[CLIENT] open()`)
//   client.send('{"command":"getEventState","eventType":"happyHour"}')
// })
// client.on('message', function (a, b) {
//   console.log('msg from server!', a, b)
// })
// client.on('message', function (message) {
//   console.log(`[CLIENT] Received: ${message}`)
//   // client.send({ hola: "holaaaaasdfasdfasdf" })
//   // client.close()
// })
