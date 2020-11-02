import PubSub from 'pubsub-js'
import WebSocket from 'ws'
import { wsServer } from './../slot.services/webSocket/ws.service'

type Message = { command: 'getEventState', eventType: string, client: WebSocket }

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const runCommand = (cmd: string, data: any): void => {
  const client: WebSocket = data.client
    delete data.command
    delete data.client
    try {
      // wsServer.sendRaw(data?.payload)
      wsServer.sendRaw(data?.payload, data.client)

    } catch (error) {
      wsServer.sendRaw(data, client)

    }
}

PubSub.subscribe('echo', runCommand)