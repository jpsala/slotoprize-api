import { EventRule } from "../events"
let isHappyHour = false
const happyHourBegin = (event: EventRule) => {
  isHappyHour = true
  console.log('event begin', event.eventType, event?.description)
}
const happyHourEnd = (event: EventRule): void => {
  isHappyHour = false
  console.log('event end', event.eventType, event?.description)
}
export function initRule(rule: EventRule): void {
  rule.callBackForStart = happyHourBegin
  rule.callBackForEnd = happyHourEnd
}
export const getHappyHour = (): boolean => {
  return isHappyHour
}