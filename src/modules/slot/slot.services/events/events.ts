/* eslint-disable @typescript-eslint/restrict-plus-operands */
import later from '@breejs/later'
import { formatDistanceStrict, differenceInSeconds , parse, add, format } from 'date-fns'

import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import { GameUser } from '../../../meta/meta.types'
import { isNotebook, getAssetsUrl, toBoolean } from './../../../../helpers'
import { query } from './../../../../db'
import { createEvent, Event, EventDTO, EventPayload, Rule} from './event'
if(isNotebook()) later.date.localTime()
const allEvents: Event[] = []
let log = false
export const toggleLog = (): boolean => { return log = !log }
export const init = async (): Promise<void> =>
{
  const rulesFromDB = await query('select * from event where active = 1')
  processEvents(rulesFromDB)
}
export  function processEvents(eventsFromDB: EventDTO[]): void 
{ 
  const url = getAssetsUrl()
  for (const ruleFromDb of eventsFromDB) {
    const savedEventIdx = allEvents.findIndex(_event => Number((_event.payload).id) === Number(ruleFromDb.id))
    const savedEvent = allEvents[savedEventIdx]
    if (savedEventIdx >= 0) { 
      console.log('reloading event', savedEventIdx) 
      if (savedEvent.endTimeoutHandler) clearTimeout(savedEvent.endTimeoutHandler)  
      savedEvent.laterTimerHandler?.clear()
      allEvents.splice(savedEventIdx, 1)
    }  
    if (Number(ruleFromDb.active) === 0)   
      continue
   
    ruleFromDb.skinId = ruleFromDb.skinId ?? undefined
    ruleFromDb.popupTextureUrl = ruleFromDb.popupTextureUrl ? url + ruleFromDb.popupTextureUrl : ''
    ruleFromDb.notificationTextureUrl = ruleFromDb.notificationTextureUrl ? url + ruleFromDb.notificationTextureUrl : ''
    ruleFromDb.particlesTextureUrl = ruleFromDb.particlesTextureUrl ? url + ruleFromDb.particlesTextureUrl : ''
    ruleFromDb.rule = <Rule>JSON.parse(ruleFromDb.rule as any)

    // console.log('processEvents event', ruleFromDb.id, ruleFromDb.name, ruleFromDb.eventType )

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
  for (const eventFromDB of eventsFromDB)
  {  
    if (Number(eventFromDB.active) === 0) continue
    if (eventFromDB.duration < 0) {
      console.warn('event in the past %O, skipping %O', eventFromDB.name)
      continue
    }
    const newEvent: Partial<Event> = createEvent(eventFromDB)
    const event = scheduleEvent(newEvent) 
    allEvents.push(event)
    const payload = event.payload
    log && console.log('event loaded ', payload.name, event.rule, event.distance) 
  }

}

export function removeEvent(eventId: number): void 
{
  const savedEventIdx = allEvents.findIndex(_event => {
   return Number(_event.payload.id) === Number(eventId)
  })
  const savedEvent = allEvents[savedEventIdx] 
  if (savedEventIdx === -1) {
    console.log('Event not in memory')
    return
  }
  console.log('deletedEvent from memory', savedEvent.payload.id )
  savedEvent.laterTimerHandler?.clear() 
  savedEvent.callBackForStart = undefined
  savedEvent.callBackForStop = undefined
  if (savedEvent.endTimeoutHandler) clearTimeout(savedEvent.endTimeoutHandler)
  if (savedEventIdx >= 0) allEvents.splice(savedEventIdx, 1)
}
 export function scheduleEvent(event: Partial<Event>): Event{
  function splitDate(date): { year: number, month: number, day: number, hour: number, minute: number, second: number} {
    const dateAndTime = date.split(' ')
    if(dateAndTime.length < 2) throw createHttpError(BAD_REQUEST, 'Has to be a valid Date Time')
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
  let nexts = ''
  try
  {
    const payload = event.payload as EventPayload
    event.sched = later.schedule(scheduleData)
    event.next = event.sched.next(1, new Date()) as Date | 0
    const nextsDates = event.sched.next(3, new Date()) as Date[]
    if(Number(nextsDates) !== 0)
      for (const next of (nextsDates))
        if (next) nexts += `${(formatDistanceStrict(new Date(), next))} `        
    event.distance = event.next !== 0 ? formatDistanceStrict(new Date(), event.next) : ''
    log && console.log('scheduling', event.rule, 'name', payload.name, ' distance:', event.distance)
  } catch (error) {
    console.log('error in events, later.schedule', error, scheduleData) 
  }
   if (event.distance)
     console.log('scheduleEvent of %O distance %O ', (event.payload as any)?.name, nexts)
   else 
     console.warn('!', (event.payload as any)?.name)
   
  event.laterTimerHandler = later.setInterval(function ()
  {
    // TODO Que pasa que llama 2 veces si no hago el clear?
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
      // console.log('later.setInterval name %O, action %O, ends in %O, start again in %O', payload?.name, payload?.action, event.duration, event.distance)
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
export function dateToRule(date: Date): string{
  const day = date.getDate()
  const month = date.getMonth()
  const monthName = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][month]
  const year = date.getFullYear()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  // console.log('dateToRule', date, `* ${minutes} ${hours} ${day} ${monthName.substr(0, 3)} ? ${year}`)
  return `0 ${minutes} ${hours} ${day} ${monthName.substr(0, 3)} ? ${year}`
}
export const reloadRulesFromDb = async (): Promise<void> =>{
  for (const savedEvent of allEvents) {
    savedEvent.laterTimerHandler?.clear() 
    if (savedEvent.endTimeoutHandler) clearTimeout(savedEvent.endTimeoutHandler)
  }
  allEvents.splice(0)
  await init()
}
export const getActiveEventMultiplier = (user: GameUser): number =>{
  return allEvents.filter(event => event.isActive).reduce((multiplierAcumulator, event) =>
  {
    {
      const multiplier = event.payload.multiplier
      if(toBoolean(event.payload.devOnly) && !user.isDev) return multiplierAcumulator
      return multiplier * multiplierAcumulator
    }
  }, 1)
}
export const getActiveBetPrice = (): number =>{
  return 1
}
export const getActiveEvents = (): Event[] =>{
  return allEvents.filter(event => event.isActive)
}
export const getEvents = (): Event[] =>{
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
  console.log('allEvents', retArray)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return retArray
}
void (async () => { if (process.env.NODE_ENV !== 'testing') await init() })()
