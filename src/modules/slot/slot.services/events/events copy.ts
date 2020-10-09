/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { isArray } from 'util'
import later from '@breejs/later'
import { formatDistanceStrict, differenceInSeconds } from 'date-fns'
import { urlBase } from './../../../../helpers'
import { getSkin } from './../../slot.repo/skin.repo'
import { query } from './../../../../db'
import { createEvent, Event, EventDTO, EventPayload} from './event'
import * as testEvent from './testEvent'
// process.env.TZ = 'America/Argentina/Buenos_Aires'
let allEvents: Event[] = []
let log = false
export const toggleLog = (): boolean => { return log = !log }
export const init = async (): Promise<void> =>
{
  testEvent.run()
  const rulesFromDB = await query('select * from event where active = 1')
  const url = urlBase()
  let idx = 0
  for (const ruleFromDb of rulesFromDB) {
    ruleFromDb.skin = await getSkin(ruleFromDb.skinId)
    rulesFromDB[idx].popupTextureUrl = url + rulesFromDB[idx].popupTextureUrl
    rulesFromDB[idx].notificationTextureUrl = url + rulesFromDB[idx].notificationTextureUrl
    idx++
  }
  processEvents(rulesFromDB)
}
export function processEvents(eventsFromDB: EventDTO[]): void
{
  allEvents.forEach(event => { if (event.endTimeoutHandler) clearTimeout(event.endTimeoutHandler) })
  allEvents.forEach(event => event.laterTimerHandler?.clear())
  allEvents = []
  for (const eventFromDB of eventsFromDB)
  {
    const savedEvent = allEvents.find(event => event.payload.id === eventFromDB.id)
    if (savedEvent)
    {
      updateEvent(savedEvent, eventFromDB)
    } else
    {
      const newEvent: Partial<Event> = createEvent(eventFromDB)
      const event = scheduleEvent(newEvent)
      allEvents.push(event)
      const payload = event.payload
      log && console.log('event loaded ', payload.name, event.rule, event.distance)
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
  const raffleIdx = allEvents.findIndex(savedEvent => savedEvent.payload.id === event.payload.id)
  if (raffleIdx >= 0) allEvents.splice(raffleIdx, 1)
}

export function scheduleEvent(event: Partial<Event>): Event
{

  const scheduleData = later.parse.cron(event.rule, true)

  try
  {
    const payload = event.payload as EventPayload
    event.sched = later.schedule(scheduleData)
    event.next = event.sched.next(1, new Date()) as Date | 0
    event.distance = event.next !== 0 ? formatDistanceStrict(new Date(), event.next) : ''
    log && console.log('scheduling', event.rule, 'name', payload.name, ' distance:', event.distance)
  } catch (error) {
    console.log('error in events, later.schedule', error, scheduleData)
  }

  log && console.log('Interval begins in %O', event.distance)
  event.laterTimerHandler = later.setInterval(function ()
  {
    const payload = event.payload as EventPayload
    if (event.duration == null || event.duration == undefined) event.duration = 0
    const nexts = event.sched?.next(2, new Date()) as Date
    const seconds = differenceInSeconds(new Date(), nexts[0])
    event.next = seconds > 0 ? nexts[0] : nexts[1]
    // console.log('event.next', event.next)
    try {
      event.distance = event.next !== 0 ? formatDistanceStrict(new Date(), event.next as Date, { unit: 'second' }) : ''
    } catch (error) {
      event.distance = 'error'
    }
    if (event.callBackForStart)
    {
      payload.action = 'start'
      log && console.log('later.setInterval name %O, action %O, ends in %O, start again in %O', payload?.name, payload?.action, event.duration, event.distance)
      event.callBackForStart(event as Event)
    }
    if (event.duration > 0 && event.callBackForStop)
    {
      if (event.endTimeoutHandler)
        clearTimeout(event.endTimeoutHandler)
      event.endTimeoutHandler = setTimeout(() =>
      {
        if (Array.isArray(payload)) throw new Error('payload have to be an array')
        if (payload && payload.action) payload.action = 'stop'
        event.next = event.sched?.next(1, new Date()) as Date | 0
        event.distance = event.next !== 0 ? formatDistanceStrict(new Date(), event.next) : ''
        log && console.log('later.setInterval name %O, action %O, starts again in %O', payload?.name, payload?.action, event.distance)
        event.callBackForStop && event.callBackForStop(event as Event)
      }, event.duration * 1000)
    }


  }, scheduleData)

  return event as Event
}
export function dateToRule(date: Date): string
{

  const day = date.getDate()
  const month = date.getMonth()
  const monthName = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][month]
  const year = date.getFullYear()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  // console.log('dateToRule', date, `* ${minutes} ${hours} ${day} ${monthName.substr(0, 3)} ? ${year}`)
  return `* ${minutes} ${hours} ${day} ${monthName.substr(0, 3)} ? ${year}`
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
      const multiplier = event.payload.multiplier
      return multiplier * initMultiplier
    }
  }, 1)
}
export const getActiveBetPrice = (): number =>
{
  return 1
}
export const getActiveEvents = (): Event[] =>
{
  return allEvents.filter(event => event.isActive)
}

void (async () => { if (process.env.NODE_ENV !== 'testing') await init() })()
