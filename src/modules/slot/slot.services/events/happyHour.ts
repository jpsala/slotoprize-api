import wsService, { WebSocketMessage } from "../webSocket/ws"

import { Event } from "./events"
let isHappyHour = false
const timeForHappyHour = (event: Event) => {
  isHappyHour = true
  console.log('event', JSON.stringify(event, null, 2))
  // console.log('happyHourBegin event', event?.eventType, event?.description, event.next)
  const wsMessage: WebSocketMessage = {
    code: 200,
    message: 'OK',
    msgType: "events",
    payload: {
      eventType: 'HappyHour',
      action: 'start',
      description: event.description || '',
      textureUrl: event.textureUrl,
      devOnly: true
    }
  }
  wsService.send(wsMessage)
  // console.log('event begin', event.eventType, event?.description)
}
export const beforeEventReload = (event: Event): void => {
  console.log('HappyHour event reload ', event.rule, event.description)
}
const happyHourEnd = (event: Event): void => {
  isHappyHour = false
  console.log('happyHourEnds event', event?.eventType, event?.description)
  const wsMessage: WebSocketMessage = {
    code: 200,
    message: 'OK',
    msgType: "events",
    payload: {
      eventType: 'HappyHour',
      action: 'stop',
      description: event.description || '',
      textureUrl: 'Here goes a texture url',
      devOnly: true
    }
  }
  wsService.send(wsMessage)
}
export function initRule(rule: Event): void {
  console.log('happyHour initRule', rule)
  rule.callBackForStart = timeForHappyHour
  rule.callBackForEnd = happyHourEnd
  rule.callBackForBeforeReload = beforeEventReload
}
export const getIsHappyHour = (): boolean => {
  return isHappyHour
}