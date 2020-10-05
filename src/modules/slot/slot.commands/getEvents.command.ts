import PubSub from 'pubsub-js'
import WebSocket from 'ws'
import { formatDistanceStrict } from 'date-fns'
import { getEvents } from '../slot.services/events/events'
import { WebSocketMessage, wsServer } from '../slot.services/webSocket/ws.service'

type Message = { payload: any, client: WebSocket }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const runCommand = (cmd: string, data: Message): void => {
  const activeEvents = getEvents()
  const wsMessages: any[] = []
  activeEvents.forEach(event =>
  {
    const nexts = event.sched?.next(10, new Date()).map(next => {
      return { next, distance: formatDistanceStrict(new Date(), next) }
    }
     )
      wsMessages.push({
        active: event.isActive,
        distance: event.distance,
        duration: event.duration,
        rule: event.rule,
        type: event.eventType,
        sched: event.sched,
        payload: event.payload,
        nexts
      })
    }
  )
    const wsMessage: Partial<WebSocketMessage> = {
      code: 200,
      message: 'OK',
      msgType: 'eventsState',
      payload: wsMessages,
      isJson: true,
      log: true
    }
    wsServer.send(wsMessage as WebSocketMessage, data.client)
}

PubSub.subscribe('getEvents', runCommand)