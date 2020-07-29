import wsService, { WebSocketMessage} from "../webSocket/ws"


import { Event } from "./events"

let isHappyHour = false
const wsMessage: WebSocketMessage = {
  code: 200,
  message: 'OK',
  msgType: 'events',
  payload: {
    eventType: 'HappyHour',
    description: '',
    action: 'stop',
    devOnly: true,
    skin: undefined,
    textureUrl: '',
  }
}
const timeForHappyHour = () => {
  isHappyHour = true
  wsMessage.payload.action = 'start'
  wsService.send(wsMessage)
  console.log('timeForHappyHour message sended', wsMessage)
}
const happyHourEnd = (): void => {
  isHappyHour = false
  wsMessage.payload.action = 'stop'
  wsService.send(wsMessage)
  // console.log('happyHourEnds event', event?.eventType, event?.description)
  wsService.send(wsMessage)
}
export function initRule(event: Event): void {
  event.callBackForStart = timeForHappyHour
  event.callBackForEnd = happyHourEnd
  event.callBackForBeforeReload = beforeEventReload
  wsMessage.payload.action = 'stop'
  wsMessage.payload.skin = event.skin
  wsMessage.payload.devOnly = event.devOnly || false
  wsMessage.payload.description = event.description || ''
  wsMessage.payload.textureUrl = event.textureUrl || ''
}
export const getIsHappyHour = (): boolean => {
  return isHappyHour
}
export const getWsMessage = (): WebSocketMessage => {
  return wsMessage
}
export const beforeEventReload = (): void => {
  // console.log('HappyHour event reload ', event.rule, event.description)
}