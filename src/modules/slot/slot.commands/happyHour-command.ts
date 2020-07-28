import PubSub from 'pubsub-js'
import WebSocket from 'ws'
import wsServer, { WebSocketMessage } from '../slot.services/webSocket/ws'
import { getWsMessage, getIsHappyHour } from '../slot.services/events/happyHour.event'

type Message = { command: 'getEventState', eventType: string, client: WebSocket }

export const runCommand = (cmd: string, data: Message): void => {
  if (!data || typeof data !== 'object' || !data?.eventType)
    return
  const eventType = data.eventType
  if (eventType === 'happyHour') {
    const isHappyHour = getIsHappyHour()
    const response: WebSocketMessage = getWsMessage()
    response.payload.action = isHappyHour ? 'start' : 'stop'
    wsServer.send(response, data.client)
  }
}

PubSub.subscribe('getEventState', runCommand)