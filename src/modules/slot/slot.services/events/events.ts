import later from 'later'
import moment from 'moment'
import { query } from './../../../../db'
import { initRule as initHappyRule } from "./happyHour/happyHour"
import { initRule as initMiscRule } from "./miscEvent"

export type EventType = 'HappyHour' | 'TestType' | 'MiscType'
export interface EventRule {
  eventType: EventType,
  rule: string,
  description?: string;
  duration: number,
  callBackForStart?(eventRule: EventRule): void,
  callBackForEnd?(eventRule: EventRule): void
}
let rulesFromDB: EventRule[]
const getEventsFromDb = async (): Promise<EventRule[]> => {
  return await query('select * from events where active = 1') as EventRule[]
}
const allEvents: EventInfo[] = []
interface EventInfo {
  event: EventRule;
  getNextEvents(amount: number): Date | Date[];
}
export function processEvents(rulesFromDB: EventRule[]): void {
  rulesFromDB.forEach(rule => {
    if (rule.eventType === 'HappyHour') { initHappyRule(rule) }
    else if (rule.eventType === 'TestType') { initHappyRule(rule) }
    else if (rule.eventType === 'MiscType') { initMiscRule(rule) }
    else {
      console.log('events processEvents initMiscRule', rule)
      initMiscRule(rule)
    }
    // throw new Error(`No handler for this type of event ${rule.eventType}`)
    allEvents.push(createEvent(rule))
  })
}
export function initEvents(): void {
  rulesFromDB.forEach(rule => {
    if (rule.eventType === 'HappyHour')
      initHappyRule(rule)
    else
      throw new Error('No handler for this type of event')
    allEvents.push(createEvent(rule))
  })
}
export function createEvent(eventRule: EventRule): EventInfo {
  process.env.TZ = 'America/Argentina/Buenos_Aires'
  later.date.localTime()
  // const scheduleData = later.parse.cron('0 02 22 ? * * *', true)
  const scheduleData = later.parse.cron(eventRule.rule, true)
  const sched = later.schedule(scheduleData)
  const next = sched.next(1, new Date())
  // console.log('next', moment(next as Date).format('DD/MM/YY hh:mm:ss'))
  later.setInterval(function () {
    if (!eventRule.callBackForStart || !eventRule.callBackForEnd) throw new Error('event have no point if there are start or end callbacks')
    eventRule.callBackForStart(eventRule)
    setTimeout(() => {
      if (eventRule.callBackForEnd) eventRule.callBackForEnd(eventRule)
    }, eventRule.duration * 1000)
  }, scheduleData)
  return {
    event: eventRule,
    getNextEvents(amount: number): Date[] | Date {
      const ret = sched.next(amount, new Date())
      return ret
    },
  }
}
export function getAllEvents(): EventInfo[] {
  return allEvents
}
export function getNextEvent(eventType: EventType, amount = 1): Date | Date[] | undefined {
  const event: EventInfo = allEvents.find(_eventInfo => {
    return _eventInfo.event.eventType === eventType
  }) as EventInfo
  if (!event) return undefined
  return event.getNextEvents(amount)
}
void (async function run() {
  rulesFromDB = await getEventsFromDb()
  // console.log('rdb', rulesFromDB)
  processEvents(rulesFromDB)
})()


// const rulesFromDB: EventRule[] = [
//   {
//     eventType: 'HappyHour',
//     description: 'evento1',
//     rule: '*/20 * * * * *',
//     duration: 5
//   },
//   {
//     eventType: 'HappyHour',
//     description: 'evento2',
//     rule: '* */1 * * * *',
//     duration: 10
//   }
// ]