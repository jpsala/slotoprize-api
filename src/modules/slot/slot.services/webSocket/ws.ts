import { Server } from 'http'
import { eventNames } from 'process'
import { serialize } from 'class-transformer'
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import WebSocket from 'ws'
import emitter from '../emitterService'
import { isValidJSON } from '../../../../helpers'
import { EventType } from './../events/events'

let server: WebSocket.Server
let ws: WebSocket
type Subscription = { message: string, cb: () => void }
export interface WebSocketMessage {
  code: 200 | 400 | 500;
  message: 'OK' | string;
  msgType: 'events';
  payload: {
    eventType: EventType;
    description: string;
    action: 'start' | 'stop' | 'notification';
    devOnly: boolean;
    textureUrl: string;
  }
}
type WsServerService = {
  server: WebSocket.Server,
  ws: WebSocket,
  send(_msg: WebSocketMessage, client?: WebSocket): void,
}
const createWsServerService = (): WsServerService => {
  server = new WebSocket.Server({
    port: 8890,
  })
  server.on('connection', function (_ws) {
    ws = _ws
    console.log(`[SERVER] connection()`)
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    ws.on('message', async function (message) {
      if (!(typeof message === 'string'))
        throw new Error('ws on message: message have to be string')
      const isValid = isValidJSON(message)
      let msg: any
      console.log('msg', message)
      if (isValid) msg = JSON.parse(message)
      else msg = message
      await emitter.emit('ws', msg)
      console.log(`[SERVER] Received:`, message)
    })
  })
  // const tst = {
  //   code: 200,
  //   message: 'OK',
  //   msgType: 'events',
  //   payload: {
  //     eventType: 'happyHour',
  //     description: eventNames,
  //     isActive: true,
  //     devOnly: false,
  //     textureUrl:
  //       'http://wopidom.homelinux.com/public/assets/notifications/clock_icon.png',
  //   },
  // }
  const send = (_msg: WebSocketMessage, client: WebSocket | undefined = undefined): void => {
    // @TODO ver abajo
    if (client) return
    const msg = JSON.stringify(_msg)
    console.log('sending msg to clients')
    server.clients.forEach((client) => {
      console.log('sended to client')
      client.send(msg)
    })
  }
  return { server, ws, send }
}

const wsServer = createWsServerService()
export default wsServer

console.log('ws server started at port 8890...')

// client test:

// const client = new WebSocket('ws://127.0.0.1:8889/ws/chat')
// // const client = new WebSocket('ws://wopidom.homelinux.com:8889/ws/chat')
// client.on('open', function () {
//   console.log(`[CLIENT] open()`)
//   client.send(JSON.stringify({ type: 'hi', data: { hola: 'holaaaa' } }))
// })
// emitter.on('ws', (msg) => {
//   console.log('msg', msg)
// })

// client.on('message', function (message) {
//   console.log(`[CLIENT] Received: ${message}`)
//   // client.send({ hola: "holaaaaasdfasdfasdf" })
//   // client.close()
// })
