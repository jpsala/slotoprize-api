import { EventRule } from "./events"
const miscEventBegin = (event: EventRule) => {
  console.log('miscEventBegin event', event?.eventType, event?.description)
  // console.log('event begin', event.eventType, event?.description)
}
const miscEventEnd = (event: EventRule): void => {
  console.log('miscEventEnds event', event?.eventType, event?.description)
}
export function initRule(rule: EventRule): void {
  rule.callBackForStart = miscEventBegin
  rule.callBackForEnd = miscEventEnd
}