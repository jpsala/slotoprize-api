import wsService, { WebSocketMessage } from "../webSocket/ws"


import { Event } from "./events"
let isHappyHour = false
const wsMessage: WebSocketMessage = {
  code: 200,
  message: 'OK',
  msgType: "events",
  payload: {
    eventType: 'HappyHour',
    action: 'stop',
    description: '',
    textureUrl: '',
    devOnly: true
  }
}
const timeForHappyHour = (event: Event) => {
  isHappyHour = true
  wsMessage.payload.action = 'start'
  wsMessage.payload.description = event.description || ''
  wsMessage.payload.textureUrl = event.textureUrl || ''
  wsService.send(wsMessage)
  console.log('message sended', wsMessage)
}
const happyHourEnd = (event: Event): void => {
  isHappyHour = false
  wsMessage.payload.action = 'stop'
  wsMessage.payload.description = event.description || ''
  wsMessage.payload.textureUrl = event.textureUrl || ''
  wsService.send(wsMessage)
  console.log('happyHourEnds event', event?.eventType, event?.description)
  wsService.send(wsMessage)
}
export function initRule(event: Event): void {
  console.log('happyHour initRule', event)
  event.callBackForStart = timeForHappyHour
  event.callBackForEnd = happyHourEnd
  event.callBackForBeforeReload = beforeEventReload
  wsMessage.payload.action = 'stop'
  wsMessage.payload.description = event.description || ''
  wsMessage.payload.textureUrl = event.textureUrl || ''
}
export const getIsHappyHour = (): boolean => {
  return isHappyHour
}
export const getWsMessage = (): WebSocketMessage => {
  return wsMessage
}
export const beforeEventReload = (event: Event): void => {
  console.log('HappyHour event reload ', event.rule, event.description)
}