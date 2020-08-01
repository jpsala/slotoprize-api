import WebSocket, { Server} from 'ws'
import PubSub from 'pubsub-js'
import { isValidJSON } from '../../../../helpers'
import { EventPayload } from './../events/event'

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
export interface WebSocketMessage {
  code: 200 | 400 | 500;
  message: 'OK' | string;
  msgType: 'events';
  payload: EventPayload
}
type WsServerService = {
  server: WebSocket.Server,
  ws: WebSocket,
  send(_msg: WebSocketMessage, client?: WebSocket): void,
}
type MessageForEmit = {
  command: string;
}
//#endregion
let server: WebSocket.Server
let ws: WebSocket

const createWsServerService = (): WsServerService => {
  server = new Server({
    port: 8890,
  })
  server.on('connection', function (ws) {
    console.log(`[SERVER] connection()`)
    ws.on('message', onMessage)
  })
  const send = (_msg: WebSocketMessage, client: WebSocket | undefined = undefined): void => {
    // @TODO ver abajo
    const payload = JSON.stringify(_msg.payload)
    const msgStr = Object.assign({}, _msg) as any
    msgStr.payload = payload
    const msg = JSON.stringify(msgStr)
    // console.log('msg', msg)
    if (client) {
      client.send(msg)
      console.log('sended to specific client')
    }
    else {
      console.log('sending msg to all clients', msg)
      server.clients.forEach((client) => {
        console.log('sended to client')
        client.send(msg)
      })
    }
  }
  const onMessage = function (message): void {
    console.log('message', message)
    // console.log(`[SERVER] Received:`, message.subsrtr(0,60))
    if (!(typeof message === 'string'))
      throw new Error('ws on message: message have to be string')
    const isValid = isValidJSON(message)
    if (!isValid) throw Error(`invalid JSON on webSocket incomming message: ${message}`)
    const msg = JSON.parse(message)
    if (msg.command) {
      msg.client = ws
      PubSub.publish(msg.command, msg)
    }
    PubSub.publish('ws', msg)
  }
  return { server, ws, send }
}
console.log('ws.ts')
let wsServer: WsServerService
if (process.env.NODE_ENV !== 'testing') {
  console.log('ws server started at port 8890...')
  wsServer = createWsServerService()
} else {
  wsServer = { send: (_msg: WebSocketMessage, client?: WebSocket | undefined) => { console.log('ws mock send') } } as WsServerService
}

export default wsServer


// client test:

// const client = new WebSocket('ws://127.0.0.1:8890/ws/chat')
// const client = new WebSocket('ws://wopidom.homelinux.com:8890/ws/chat')
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
