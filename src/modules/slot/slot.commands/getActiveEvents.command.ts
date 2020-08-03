import PubSub from 'pubsub-js'
import WebSocket from 'ws'
import { getActiveEvents } from '../slot.services/events/events'
import wsServer, { WebSocketMessage } from '../slot.services/webSocket/ws'
import { EventPayload } from '../slot.services/events/event'

type Message = { payload: any, client: WebSocket }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const runCommand = (cmd: string, data: Message): void => {
    const activeEvents = getActiveEvents()
    const wsMessages: EventPayload[] = []
    activeEvents.forEach(event => wsMessages.push(event.payload as EventPayload))
    const wsMessage: Partial<WebSocketMessage> = {
      code: 200,
      message: 'OK',
      msgType: 'eventsState',
      payload: wsMessages
    }
    wsServer.send(wsMessage as WebSocketMessage, data.client)
}

PubSub.subscribe('getEventState', runCommand)