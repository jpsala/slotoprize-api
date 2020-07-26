import { Event } from "./events"
const miscEventBegin = (event: Event) => {
  console.log('miscEventBegin event', event?.eventType, event?.description)
  // console.log('event begin', event.eventType, event?.description)
}
const miscEventEnd = (event: Event): void => {
  console.log('miscEventEnds event', event?.eventType, event?.description)
}
export function initRule(rule: Event): void {
  rule.callBackForStart = miscEventBegin
  rule.callBackForEnd = miscEventEnd
}