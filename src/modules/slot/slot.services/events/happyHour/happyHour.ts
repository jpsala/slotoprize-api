import { EventRule } from "../events"
import wsService from "../../webSocket/ws"
let isHappyHour = false
const happyHourBegin = (event: EventRule) => {
  isHappyHour = true
  console.log('happyHourBegin event', event?.eventType, event?.description)
  wsService.send({
    code: 200,
    message: 'event',
    msgType: 'happyHour',
    payload: event
  })
  // console.log('event begin', event.eventType, event?.description)
}
const happyHourEnd = (event: EventRule): void => {
  isHappyHour = false
  console.log('happyHourEnds event', event?.eventType, event?.description)
}
export function initRule(rule: EventRule): void {
  rule.callBackForStart = happyHourBegin
  rule.callBackForEnd = happyHourEnd
}
export const getHappyHour = (): boolean => {
  return isHappyHour
}