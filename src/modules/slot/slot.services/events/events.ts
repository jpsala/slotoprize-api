/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { isArray } from 'util'
import later from '@breejs/later'
import { formatDistanceStrict, differenceInSeconds , parse, add, format } from 'date-fns'


import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import { urlBase } from './../../../../helpers'
import { getSkin } from './../../slot.repo/skin.repo'
import { query } from './../../../../db'
import { createEvent, Event, EventDTO, EventPayload} from './event'
// import * as testEvent from './testEvent'
// process.env.TZ = 'America/Argentina/Buenos_Aires'
let allEvents: Event[] = []
let log = true
export const toggleLog = (): boolean => { return log = !log }
export const init = async (): Promise<void> =>
{
  // testEvent.run()
  // later.date.localTime()
  const rulesFromDB = await query('select * from event where active = 1')
  const url = urlBase()
  for (const ruleFromDb of rulesFromDB) {
    ruleFromDb.skin = await getSkin(ruleFromDb.skinId)
    ruleFromDb.popupTextureUrl = url + ruleFromDb.popupTextureUrl
    ruleFromDb.notificationTextureUrl = url + ruleFromDb.notificationTextureUrl
    ruleFromDb.rule = JSON.parse(ruleFromDb.rule)
    console.log('init() ruleFromDb', ruleFromDb.id, ruleFromDb.name, ruleFromDb.eventType )
    // if (ruleFromDb.rule.type === 'weekly') {
    //   for (const day of ruleFromDb.rule.days)
    //     for (const hour of day.hours) {
    //       console.log('parse', `${<string>day.day} ${<string>hour.start}`, 'e HH:mm:ss')
    //       let startDay = parse(`${<string>day.day} ${<string>hour.start}`, 'e HH:mm:ss', new Date())
    //       const endDate = add(startDay, { seconds: <number>ruleFromDb.duration })
    //       console.log('startDate', startDay, endDate)
    //       if (new Date() > startDay) {
    //         startDay = add(new Date(), { seconds: 1 })
    //         hour.start = format(startDay, 'HH:mm:ss')
    //       }
    //       const diffInSeconds = differenceInSeconds(endDate, startDay)
    //       ruleFromDb.lateDuration = diffInSeconds
    //     }
    //   console.log('ruleFromDb', ruleFromDb)
    // }
    // if (ruleFromDb.rule.type === 'daily') {
    //   console.log('ruleFromDb before', Object.assign({},ruleFromDb.rule))
    //   for (const hour of ruleFromDb.rule.hours) {
    //     console.log('parse', `${<string>hour.start}`, 'HH:mm:ss')
    //     let startDay = parse(`${<string>hour.start}`, 'HH:mm:ss', new Date())
    //     const endDate = add(startDay, { seconds: <number>ruleFromDb.duration })
    //     console.log('startDate %O endDate %O', startDay, endDate)
    //     if (new Date() > startDay && new Date() < endDate) {
    //       startDay = add(new Date(), { seconds: 1 })
    //       hour.start = format(startDay, 'HH:mm:ss')
    //     }
    //     const diffInSeconds = differenceInSeconds(endDate, startDay)
    //     ruleFromDb.lateDuration = diffInSeconds
    //   }
    //   console.log('ruleFromDb after', ruleFromDb.rule)
    // }
    if (ruleFromDb.rule.type === 'unique') {
      const ruleDateStart = parse(ruleFromDb.rule.start, 'yyyy-MM-dd HH:mm:ss', new Date())
      let dateStart = ruleDateStart
      if (new Date() > ruleDateStart) {
        dateStart = add(new Date(),{seconds: 1})
        ruleFromDb.rule.start = format(dateStart, 'yyyy-MM-dd HH:mm:ss')
      }
      const dateEnd = parse(ruleFromDb.rule.end, 'yyyy-MM-dd HH:mm:ss', new Date())
      const diffInSeconds = differenceInSeconds( dateEnd, dateStart)
      ruleFromDb.duration  = diffInSeconds
    }
  }
  processEvents(rulesFromDB)
}
export function processEvents(eventsFromDB: EventDTO[], isUpdate = false): void
{
  if(isUpdate){
    allEvents.forEach(event => { if (event.endTimeoutHandler) clearTimeout(event.endTimeoutHandler) })
    allEvents.forEach(event => <void>event.laterTimerHandler?.clear())
    allEvents = []
  }
  for (const eventFromDB of eventsFromDB)
  {  
    if(eventFromDB.duration < 0) continue
    const newEvent: Partial<Event> = createEvent(eventFromDB)
    const event = scheduleEvent(newEvent) 
    allEvents.push(event)
    const payload = event.payload as EventPayload
    log && console.log('event loaded ', payload.name, event.rule, event.distance)
  }
}
function updateEvent(savedEvent: Event, eventFromDB: EventDTO)
{
  log && console.log('events updateEvent', savedEvent.eventType, savedEvent.rule)
  console.log('savedEvent.rule', savedEvent, eventFromDB)
  if (savedEvent.rule !== eventFromDB.rule || eventFromDB.duration !== savedEvent.duration)
  {
    deleteEvent(savedEvent)
    processEvents([eventFromDB], true)
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
  function splitDate(date): { year: number, month: number, day: number, hour: number, minute: number, second: number} {
    const dateAndTime = date.split(' ')
    const [year, month, day] = dateAndTime[0].split('-')
    const {hour, minute, second} = splitHour(dateAndTime[1])
    return {year: Number(year), month: Number(month), day: Number(day), hour, minute, second}
  }
  function splitHour(hour: string): {hour: number, minute: number, second: number} {
    const [_hour, minute, second] = hour.split(':')
      return {hour: Number(_hour), minute: Number(minute??0), second: Number(second??0)}
  }
  // const scheduleData = later.parse.cron(event.rule, true)
  if (!event.rule) throw createHttpError(BAD_REQUEST, 'rule has to be a valid rule')
  let scheduleData
  if (event.rule.type === 'cron') 
    {scheduleData = later.parse.cron(event.rule.rule, true)}
  else if (event.rule.type === 'daily') {
    scheduleData = later.parse.recur()
    event.rule.hours?.forEach(_hour => {
      const { hour, minute, second } = splitHour(_hour.start)
      scheduleData.and().on(hour).hour().on(minute).minute().on(second ?? 0).second()
    })
  }
  else if (event.rule.type === 'unique' && event.rule.start) {
    const { year, month, day, hour, minute, second } = splitDate(event.rule.start)
    scheduleData = later.parse.recur()
    scheduleData.and().on(year).year().on(month).month().on(day).dayOfMonth()
      .on(hour).hour().on(minute).minute().on(second).second()
  }
  else if (event.rule.type === 'weekly') {
    scheduleData = later.parse.recur()
    event.rule.days?.forEach(_day => {
      _day?.hours?.forEach(_hour => {
        const { hour, minute, second } = splitHour(_hour.start)
        scheduleData.and().on(_day.day).dayOfWeek().on(hour).hour().on(minute).minute().on(second ?? 0).second()
      })
    })
  }
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
    // @TODO Que pasa que llama 2 veces si no hago el clear?
    if (event.eventType === 'raffle' || event.rule?.type === 'unique')
      event.laterTimerHandler?.clear()
    const payload = event.payload as EventPayload
    if (event.duration == null || event.duration == undefined) event.duration = 0
    const nexts = event.sched?.next(2, new Date()) as Date
    const seconds = differenceInSeconds(new Date(), nexts[0])
    event.next = seconds > 0 ? nexts[0] : nexts[1]
    try {
      event.distance = event.next !== 0 ? formatDistanceStrict(new Date(), event.next as Date, { unit: 'second' }) : ''
    } catch (error) {
      event.distance = 'error'
    }
    if (event.callBackForStart)
    {
      payload.action = 'start'
      event.isActive = true
      if (event.duration && event.duration > 0) event.isActive = true
      console.log('later.setInterval name %O, action %O, ends in %O, start again in %O', payload?.name, payload?.action, event.duration, event.distance)
      // log && console.log('later.setInterval name %O, action %O, ends in %O, start again in %O', payload?.name, payload?.action, event.duration, event.distance)
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
        event.isActive = false
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
  return `0 ${minutes} ${hours} ${day} ${monthName.substr(0, 3)} ? ${year}`
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const updateRule = async (rule: any): Promise<void> => {
  console.log('update rule', JSON.stringify(rule,null,2))
  let ruleParsed
  try {
    ruleParsed = JSON.parse(rule.rule)
  } catch (error) {
    throw createHttpError(BAD_REQUEST, 'Rule can not be parsed')
  }
  const event = allEvents.find(_event => {
    return String((_event.payload as EventPayload).id) === String(rule.id)
  })
  const eventForSave = {
    active: rule.active,
    betPrice: rule.betPrice,
    data: rule.data,
    description: rule.description,
    devOnly: rule.devOnly,
    duration: rule.duration,
    eventType: rule.eventType,
    id: rule.id,
    multiplier: rule.multiplier,
    name: rule.name,
    notificationMessage: rule.notificationMessage,
    notificationTextureUrl: rule.notificationTextureUrl,
    particlesTextureUrl: rule.particlesTextureUrl,
    popupMessage: rule.popupMessage,
    popupTextureUrl: rule.popupTextureUrl,
    rule: ruleParsed
  }
  if(event)
    updateEvent(event, eventForSave as any)
  else
  processEvents([eventForSave as any], true)

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
export const getActiveBetPrice = (): number =>
{
  // const defaultbetPrice = Number(await getSetting('betPrice', 1))
  // const eventbetPrice = allEvents.filter(event => event.isActive).reduce((initBetPrice, event) =>
  // {
  //   {
  //     const betPrice = isArray(event.payload) ? 0 : event.payload.betPrice
  //     return betPrice + initBetPrice
  //   }
  // }, 0)
  // return eventbetPrice === 0 ? defaultbetPrice : eventbetPrice
  return 1
}
export const getActiveEvents = (): Event[] =>
{
  return allEvents.filter(event => event.isActive)
}
export const getEvents = (): Event[] =>
{
  return allEvents.filter(event => event)
}
export function getAllEvents(): any[] {
  const activeEvents = getEvents()
  const retArray: any[] = []
  activeEvents.forEach(event => {
    const nextsRaw = event.sched?.next(10, new Date())
    let nexts = 0
    if (typeof nextsRaw === 'object')
      nexts = nextsRaw.map(next => {
        return { next, distance: formatDistanceStrict(new Date(), next) }
      })
    retArray.push(Object.assign(event,{nexts}))
  })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return retArray
}
void (async () => { if (process.env.NODE_ENV !== 'testing') await init() })()
