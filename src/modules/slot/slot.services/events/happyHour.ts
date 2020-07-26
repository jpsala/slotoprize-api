import wsService from "../webSocket/ws"
import { Event } from "./events"
let isHappyHour = false
const happyHourBegin = (event: Event) => {
  isHappyHour = true
  console.log('happyHourBegin event', event?.eventType, event?.description, event.next)
  wsService.send({
    code: 200,
    message: 'event',
    msgType: 'happyHour',
    payload: event
  })
  // console.log('event begin', event.eventType, event?.description)
}
export const beforeEventsReload = (event: Event): void => {
}
const happyHourEnd = (event: Event): void => {
  isHappyHour = false
  console.log('happyHourEnds event', event?.eventType, event?.description)
}
export function initRule(rule: Event): void {
  rule.callBackForStart = happyHourBegin
  rule.callBackForEnd = happyHourEnd
  rule.callBackForBeforeReload = beforeEventsReload
}
export const getHappyHour = (): boolean => {
  return isHappyHour
}