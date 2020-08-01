import PubSub from 'pubsub-js'
import WebSocket from 'ws'

type Message = { command: 'getEventState', eventType: string, client: WebSocket }

export const runCommand = (cmd: string, data: Message): void => {
  if (!data || typeof data !== 'object' || !data?.eventType)
    return
  const eventType = data.eventType
  if (eventType === 'happyHour') {
    // @TODO happyHour
    // const isHappyHour = getIsHappyHour()
    // const response: WebSocketMessage = getWsMessage()
    // response.payload.action = isHappyHour ? 'start' : 'stop'
    // wsServer.send(response, data.client)
  }
}

PubSub.subscribe('getEventState', runCommand)