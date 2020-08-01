import PubSub from 'pubsub-js'
import WebSocket from 'ws'
import wsServer from '../slot.services/webSocket/ws'

type Message = { command: 'getEventState', eventType: string, client: WebSocket }

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const runCommand = (cmd: string, data: any): void => {
  console.log('echo', data)
    delete data.command
    wsServer.sendRaw(data?.payload)
}

PubSub.subscribe('echo', runCommand)