import later from 'later'
import { query } from './../../../../db'
import { initRule as initHappyRule } from "./happyHour"
import { initRule as initMiscRule } from "./miscEvent"
import { initRuleCalledFromEvents as initRaffleRule } from './raffle'
// process.env.TZ = 'America/Argentina/Buenos_Aires'
// later.date.localTime()
export type EventType = 'HappyHour' | 'TestType' | 'MiscType' | 'Raffle'
export interface Event {
  id: number,
  eventType: EventType,
  rule: string,
  description?: string;
  duration: number,
  laterTimerHandler: later.Timer,
  next: Date | 0,
  sched: later.Schedule,
  callBackForStart?(event: Event): void,
  callBackForEnd?(event: Event): void,
  callBackForBeforeReload?(event: Event): void,
}
const allEvents: Event[] = []
export const init = async (): Promise<void> => {
  const rulesFromDB = await query('select * from events where active = 1') as Event[]
  processEvents(rulesFromDB)
}
export function processEvents(eventsFromDB: Event[]): void {
  for (const eventFromDB of eventsFromDB) {
    const savedEvent = allEvents.find(event => event.id === eventFromDB.id)
    if (savedEvent) {
      if (savedEvent.callBackForBeforeReload) savedEvent.callBackForBeforeReload(eventFromDB)
      updateEvent(savedEvent, eventFromDB)
    } else {
      createEvent(eventFromDB)
    }
  }
  function updateEvent(savedEvent: Event, eventFromDB: Event) {
    if (savedEvent.rule !== eventFromDB.rule)
      savedEvent.laterTimerHandler.clear()
    savedEvent.duration = eventFromDB.duration
    savedEvent.eventType = eventFromDB.eventType
    savedEvent.description = eventFromDB.description
  }
}
export function createEvent(event: Event): void {
  scheduleEvent(event)
  if (event.eventType === 'HappyHour') initHappyRule(event)
  else if (event.eventType === 'TestType') initHappyRule(event)
  else if (event.eventType === 'MiscType') initMiscRule(event)
  else if (event.eventType === 'Raffle') initRaffleRule(event)
  else initMiscRule(event)
  allEvents.push(event)
}
export function scheduleEvent(event: Event): Event {
  const scheduleData = later.parse.cron(event.rule, true)
  event.sched = later.schedule(scheduleData)
  event.next = event.sched.next(1, new Date()) as Date
  event.laterTimerHandler = later.setInterval(function () {
    if (!event.callBackForStart || !event.callBackForEnd)
      throw new Error('event have no point if there are start or end callbacks')
    event.next = event.sched.next(1, new Date()) as Date
    event.callBackForStart(event)
    setTimeout(() => {
      if (event.callBackForEnd) event.callBackForEnd(event)
    }, event.duration * 1000)
  }, scheduleData)
  return event
}
export function dateToCronRule(date: Date): string {
  const day = date.getDay()
  const month = date.getMonth()
  const monthName = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][month - 1]
  const year = date.getFullYear()
  return `0 0 0 ${day} ${monthName.substr(0, 3)} ? ${year}`
}
export function getNextEventById(eventId: number): Date | Date[] | undefined {
  const event: Event = allEvents.find(event => {
    return event.id === eventId
  }) as Event
  if (!event) return undefined
  return getNextEvent(event)
}
export const getNextEvent = (event: Event): Date => {
  return event.sched.next(1, new Date()) as Date
}
export function getNextEventByType(eventType: EventType): Date | Date[] | undefined {
  const event: Event = allEvents.find(_event => {
    return _event.eventType === eventType
  }) as Event
  if (!event) return undefined
  return getNextEvent(event)
}
export const updateRulesFromDb = async (): Promise<void> => {
  await init()
}

void (async () => { await init() })()
