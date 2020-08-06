import { isArray } from 'util'
import later from 'later'
import { formatDistanceStrict, differenceInSeconds } from 'date-fns'
import { getSetting } from './../settings.service'
import { getSkin } from './../../slot.repo/skin.repo'
import { query } from './../../../../db'
import { createEvent, Event, EventDTO } from './event'

// process.env.TZ = 'America/Argentina/Buenos_Aires'
let allEvents: Event[] = []
let log = false
export const toggleLog = (): boolean => { return log = !log }
export const init = async (): Promise<void> =>
{
  const rulesFromDB = await query('select * from event where active = 1')
  for (const ruleFromDb of rulesFromDB)
    ruleFromDb.skin = await getSkin(ruleFromDb.skinId)
  processEvents(rulesFromDB)
}
export function processEvents(eventsFromDB: EventDTO[]): void
{
  allEvents.forEach(event => { if (event.endTimeoutHandler) clearTimeout(event.endTimeoutHandler) })
  allEvents.forEach(event => event.laterTimerHandler?.clear())
  allEvents = []
  for (const eventFromDB of eventsFromDB)
  {
    const savedEvent = allEvents.find(event => !isArray(event.payload) && event.payload.id === eventFromDB.id)
    if (savedEvent)
    {
      updateEvent(savedEvent, eventFromDB)
    } else
    {
      const newEvent: Partial<Event> = createEvent(eventFromDB)
      const event = scheduleEvent(newEvent)
      allEvents.push(event)
    }
  }
  function updateEvent(savedEvent: Event, eventFromDB: EventDTO)
  {
    log && console.log('events updateEvent', savedEvent.eventType, savedEvent.rule)
    if (savedEvent.rule !== eventFromDB.rule || eventFromDB.duration !== savedEvent.duration)
    {
      deleteEvent(savedEvent)
      createEvent(eventFromDB)
    }
  }
}
export function deleteEvent(event: Event): void
{
  event.laterTimerHandler?.clear()
  if (event.endTimeoutHandler) clearTimeout(event.endTimeoutHandler)
  const raffleIdx = allEvents.findIndex(savedEvent => !isArray(savedEvent.payload) && !isArray(event.payload) && savedEvent.payload.id === event.payload.id)
  if (raffleIdx >= 0) allEvents.splice(raffleIdx, 1)
}

export function scheduleEvent(event: Partial<Event>): Event
{

  const scheduleData = later.parse.cron(event.rule, true)

  event.sched = later.schedule(scheduleData)
  event.next = event.sched.next(1, new Date()) as Date | 0
  event.distance = event.next !== 0 ? formatDistanceStrict(new Date(), event.next) : ''

  log && console.log('Interval begins in %O', event.distance)
  event.laterTimerHandler = later.setInterval(function ()
  {
    if (Array.isArray(event.payload)) throw new Error('Event.paylod can not be an array here')
    if (event.payload == null) throw new Error('Event.paylod can not be undefined')
    if (event.duration == null || event.duration == undefined) event.duration = 0
    const nexts = event.sched?.next(2, new Date()) as Date
    const seconds = differenceInSeconds(new Date(), nexts[0])
    event.next = seconds > 0 ? nexts[0] : nexts[1]
    event.distance = event.next !== 0 ? formatDistanceStrict(new Date(), event.next as Date, { unit: 'second' }) : ''

    // event.next = event.sched?.next(1, new Date()) as Date | 0
    // event.distance = event.next !== 0 ? formatDistanceStrict(new Date(), event.next, { unit: 'second' }) : ''

    if (event.callBackForStart)
    {
      event.payload.action = 'start'
      log && console.log('later.setInterval name %O, action %O, ends in %O, start again in %O', event.payload?.name, event.payload?.action, event.duration, event.distance)
      event.callBackForStart(event as Event)
    }
    if (event.duration > 0 && event.callBackForStop)
    {
      if (event.endTimeoutHandler)
        clearTimeout(event.endTimeoutHandler)
      event.endTimeoutHandler = setTimeout(() =>
      {
        if (Array.isArray(event.payload)) throw new Error('event.payload have to be an array')
        if (event.payload && event.payload.action) event.payload.action = 'stop'
        event.next = event.sched?.next(1, new Date()) as Date | 0
        event.distance = event.next !== 0 ? formatDistanceStrict(new Date(), event.next) : ''
        log && console.log('later.setInterval name %O, action %O, starts again in %O', event.payload?.name, event.payload?.action, event.distance)
        event.callBackForStop && event.callBackForStop(event as Event)
      }, event.duration * 1000)
    }


  }, scheduleData)

  return event as Event
}
export function dateToRule(date: Date): string
{
  const day = date.getUTCDate()
  const month = date.getUTCMonth()
  const monthName = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][month]
  const year = date.getFullYear()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  // console.log('dateToRule', date, `0 ${minutes} ${hours} ${day} ${monthName.substr(0, 3)} ? ${year}`)
  return `0 ${minutes} ${hours} ${day} ${monthName.substr(0, 3)} ? ${year}`
}
export const updateRulesFromDb = async (): Promise<void> =>
{
  await init()
}
export const getActiveEventMultiplier = (): number =>
{
  return allEvents.filter(event => event.isActive).reduce((initMultiplier, event) =>
  {
    {
      const multiplier = isArray(event.payload) ? 0 : event.payload.multiplier
      return multiplier * initMultiplier
    }
  }, 1)
}
export const getActiveBetPrice = async (): Promise<number> =>
{
  const defaultbetPrice = Number(await getSetting('betPrice', 1))
  const eventbetPrice = allEvents.filter(event => event.isActive).reduce((initBetPrice, event) =>
  {
    {
      const betPrice = isArray(event.payload) ? 0 : event.payload.betPrice
      return betPrice + initBetPrice
    }
  }, 0)
  return eventbetPrice === 0 ? defaultbetPrice : eventbetPrice
}
export const getActiveEvents = (): Event[] =>
{
  return allEvents.filter(event => event.isActive)
}

void (async () => { if (process.env.NODE_ENV !== 'testing') await init() })()
