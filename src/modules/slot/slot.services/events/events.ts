import later from 'later'
import { formatDistanceToNow } from 'date-fns'
import { Skin, getSkin } from './../../slot.repo/skin.repo'
import { query } from './../../../../db'
import { initRule as initHappyRule } from "./happyHour"
import { initRule as initRaffleRule } from './raffle'

// process.env.TZ = 'America/Argentina/Buenos_Aires'
// later.date.localTime()
export type EventType = 'HappyHour' | 'Raffle'
export interface Event {
  id: number,
  eventType: EventType,
  rule: string,
  description?: string;
  duration: number,
  laterTimerHandler: later.Timer,
  next: Date | 0,
  distance: string,
  skinId?: number,
  skin?: Skin,
  sched: later.Schedule,
  textureUrl?: string;
  data?: any,
  callBackForStart?(event: Event): void,
  callBackForEnd?(event: Event): void,
  callBackForBeforeReload?(event: Event): void,
  callBackForBeforeDelete?(event: Event): void,
}
const allEvents: Event[] = []
export const init = async (): Promise<void> => {
  const rulesFromDB = await query('select * from event where active = 1') as Event[]
  for (const ruleFromDb of rulesFromDB) {
    let skin: Skin | undefined = undefined
    if (ruleFromDb.skinId)
      skin = await getSkin(ruleFromDb.skinId)
    ruleFromDb.skin = skin
  }
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
    if (savedEvent.rule !== eventFromDB.rule || eventFromDB.duration !== savedEvent.duration) {
      deleteEvent(savedEvent)
      createEvent(eventFromDB)
    } else { savedEvent.description = eventFromDB.description }
  }
}
export function deleteEvent(event: Event): void {
  event.laterTimerHandler.clear()
  const raffleIdx = allEvents.findIndex(savedEvent => savedEvent.id === event.id)
  if (raffleIdx >= 0) allEvents.splice(raffleIdx, 1)
}
export function createEvent(event: Event): void {
  allEvents.push(event)
  scheduleEvent(event)
}
export function scheduleEvent(event: Event): Event {
  const scheduleData = later.parse.cron(event.rule, true)
  event.sched = later.schedule(scheduleData)
  event.next = event.sched.next(1, new Date()) as Date | 0
  event.distance = event.next !== 0 ? formatDistanceToNow(event.next) : ''
  if (event.eventType === 'HappyHour') initHappyRule(event)
  else if (event.eventType === 'Raffle') initRaffleRule(event)
  event.laterTimerHandler = later.setInterval(function () {
    if (!event?.callBackForStart && !event?.callBackForEnd)
      throw new Error('event have no point if there are no start or end callbacks')
    event.next = event.sched.next(1, new Date()) as Date | 0
    event.distance = event.next !== 0 ? formatDistanceToNow(event.next) : ''
    if (event?.callBackForStart) event.callBackForStart(event)
    setTimeout(() => {
      if (event.callBackForEnd) event.callBackForEnd(event)
    }, event.duration * 1000)
  }, scheduleData)
  return event
}
export function dateToRule(date: Date): string {
  const day = date.getUTCDate()
  const month = date.getUTCMonth()
  const monthName = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][month]
  const year = date.getFullYear()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  // console.log('dateToRule', date, `0 ${minutes} ${hours} ${day} ${monthName.substr(0, 3)} ? ${year}`)
  return `0 ${minutes} ${hours} ${day} ${monthName.substr(0, 3)} ? ${year}`
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
