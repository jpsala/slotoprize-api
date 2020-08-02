import PubSub from 'pubsub-js'
import WebSocket from 'ws'
import wsServer, { WebSocketMessage } from '../slot.services/webSocket/ws'


type Message = { command: 'getEventState', eventType: string, client: WebSocket }

export const runCommand = (cmd: string, data: Message): void => {
  console.log('data', data)
  const wsMessage: WebSocketMessage = {
    code: 400,
    message: 'Error',
    payload: data,
    msgType:'webSocket'
  }
  wsServer.send(wsMessage, data.client)
}

PubSub.subscribe('error', runCommand)