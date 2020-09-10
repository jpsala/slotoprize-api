import PubSub from 'pubsub-js'
import WebSocket from 'ws'
import { wsServer, WebSocketMessage } from './../slot.services/webSocket/ws.service'



export const runCommand = (cmd: string, data: { error: string, client: WebSocket }): void => {
  console.log('error', data.error)
  const wsMessage: WebSocketMessage = {
    code: 400,
    message: 'Error',
    payload: data.error,
    msgType:'webSocket'
  }
  wsServer.send(wsMessage, data.client)
}

PubSub.subscribe('error', runCommand)