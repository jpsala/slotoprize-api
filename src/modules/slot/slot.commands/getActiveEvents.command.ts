import PubSub from 'pubsub-js'
import WebSocket from 'ws'
import { getActiveEvents } from '../slot.services/events/events'
import { EventPayload } from '../slot.services/events/event'
import { WebSocketMessage, wsServer } from './../slot.services/webSocket/ws.service'

type Message = { payload: any, client: WebSocket }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const runCommand = (cmd: string, data: Message): void => {
  const userIsDev = (data.client as any).isDev

  const activeEvents = getActiveEvents().filter(_event => {
      if(_event.payload.devOnly && !userIsDev) return false
      return true
  })
  const wsMessages: EventPayload[] = []
  activeEvents.forEach(event => wsMessages.push(event.payload))
  const wsMessage: Partial<WebSocketMessage> = {
    code: 200,
    message: 'OKss',
    msgType: 'eventsState',
    payload: wsMessages
  }
  wsServer.send(wsMessage as WebSocketMessage, data.client)
}

PubSub.subscribe('getEventState', runCommand)