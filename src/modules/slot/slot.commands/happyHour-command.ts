import wsServer, { WebSocketMessage } from '../slot.services/webSocket/ws'
import { getWsMessage, getIsHappyHour } from './../slot.services/events/happyHour'

import { emitter } from './../slot.services/emitterService'

emitter.on('getEventState', (_data) => {
  console.log('getEventState got data')
  const data = _data as any
  if (data && typeof data === 'object' && data?.eventType === 'happyHour') {
    const isHappyHour = getIsHappyHour()
    const response: WebSocketMessage = getWsMessage()
    response.payload.action = isHappyHour ? 'start' : 'stop'
    wsServer.send(response, data.client)
  }
})