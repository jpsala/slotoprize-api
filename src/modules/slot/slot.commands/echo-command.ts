import PubSub from 'pubsub-js'
import WebSocket from 'ws'
import wsServer from '../slot.services/webSocket/ws'

type Message = { command: 'getEventState', eventType: string, client: WebSocket }

export const runCommand = (cmd: string, data: Message): void => {
  console.log('echo', data)
    delete data.command
    wsServer.sendRaw(data)
}

PubSub.subscribe('echo', runCommand)