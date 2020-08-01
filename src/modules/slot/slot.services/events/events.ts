import later from 'later'
import { formatDistanceToNow } from 'date-fns'
import { getSetting } from './../settings.service'
import { getSkin } from './../../slot.repo/skin.repo'
import { query } from './../../../../db'
import { createEvent, Event, EventDTO } from './event'

// process.env.TZ = 'America/Argentina/Buenos_Aires'
const allEvents: Event[] = []
export const init = async (): Promise<void> => {
  const rulesFromDB = await query('select * from event where active = 1')
  for (const ruleFromDb of rulesFromDB)
    ruleFromDb.skin = await getSkin(ruleFromDb.skinId)
  processEvents(rulesFromDB)
}
export function processEvents(eventsFromDB: EventDTO[]): void {
  for (const eventFromDB of eventsFromDB) {
    const savedEvent = allEvents.find(event => event.payload.id === eventFromDB.id)
    if (savedEvent) {
      updateEvent(savedEvent, eventFromDB)
    } else {
      const newEvent: Partial<Event> = createEvent(eventFromDB)
      const event = scheduleEvent(newEvent)
      allEvents.push(event)
    }
  }
  function updateEvent(savedEvent: Event, eventFromDB: EventDTO) {
    console.log('events updateEvent', savedEvent.eventType, savedEvent.rule)
    if (savedEvent.rule !== eventFromDB.rule || eventFromDB.duration !== savedEvent.duration) {
      deleteEvent(savedEvent)
      createEvent(eventFromDB)
    }
  }
}
export function deleteEvent(event: Event): void {
  event.laterTimerHandler?.clear()
  if(event.endTimeoutHandler) clearTimeout(event.endTimeoutHandler)
  const raffleIdx = allEvents.findIndex(savedEvent => savedEvent.payload.id === event.payload.id)
  if (raffleIdx >= 0) allEvents.splice(raffleIdx, 1)
}
export function scheduleEvent(event: Partial<Event>): Event {
  const scheduleData = later.parse.cron(event.rule, true)
  event.sched = later.schedule(scheduleData)
  event.next = event.sched.next(1, new Date()) as Date | 0
  event.distance = event.next !== 0 ? formatDistanceToNow(event.next) : ''
  // if (event.eventType === 'socket') initSocketRule(event)
  console.log('scheduled event', event.eventType, event.payload?.name, event.rule, event.next, event.distance, event.data)
  event.laterTimerHandler = later.setInterval(function () {
    // if(event == null || event === undefined) throw new Error('Event has to be defined')
    if(event.endTimeoutHandler) clearTimeout(event.endTimeoutHandler)
    event.next = event.sched?.next(1, new Date()) as Date | 0
    event.distance = event.next !== 0 ? formatDistanceToNow(event.next) : ''
    if(event.duration == null || event.duration == undefined) event.duration = 0
    if (event.callBackForStart) event.callBackForStart(event as Event)
    event.endTimeoutHandler = setTimeout(() => {
      if ((event.duration || 0) > 0 && event.callBackForStop) event.callBackForStop(event as Event)
    }, (event.duration || 0) * 1000)
  }, scheduleData)
  return event as Event
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
    return event.payload.id === eventId
  }) as Event
  if (!event) return undefined
  return getNextEvent(event)
}
export const getNextEvent = (event: Event): Date => {
  return event.sched?.next(1, new Date()) as Date
}
export const updateRulesFromDb = async (): Promise<void> => {
  await init()
}
export const getActiveMultiplier = (): number => {
  return allEvents.filter(event => event.isActive).reduce((initMultiplier, event) => {
    return event.payload.multiplier * initMultiplier
  }, 1)
}
export const getActiveBetPrice = async (): Promise<number> => {
  const defaultbetPrice = Number(await getSetting('betPrice', 1))
  const eventbetPrice = allEvents.filter(event => event.isActive).reduce((initBetPrice, event) => {
    return event.payload.betPrice + initBetPrice
  }, 0)
  return eventbetPrice === 0 ? defaultbetPrice : eventbetPrice
}

void (async () => { if(process.env.NODE_ENV !== 'testing') await init() })()
