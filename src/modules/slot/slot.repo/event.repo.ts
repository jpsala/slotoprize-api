/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
// #region imports
import path from 'path'
import fs, { unlinkSync } from 'fs'
import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import { format } from 'date-fns'
import { getRandomNumber, getUrlWithoutHost, addHostToPath } from './../../../helpers'
import { processEvents, updateRulesFromDb } from './../slot.services/events/events'
import { exec, query } from './../../../db'
import { EventDTO, Event  } from './../slot.services/events/event'
import * as eventsService from './../slot.services/events/events'
// #endregion

export async function addEvent(eventRule: EventDTO): Promise<void> {
  console.log('eventRule', eventRule)
  await exec('insert into event set ?', eventRule)
  await updateRulesFromDb()
}
export async function getEvents(eventId?: number, onlyGeneric = false): Promise<Event[]> {
  let where = eventId ? ` where id = ${eventId} ` : ' where true '
  where += onlyGeneric ? ` and eventType = 'generic' ` : ''
  const events = (await query(`select * from event ${where}`))
  events.forEach((event) => {
    event.popupTextureUrl = addHostToPath(event.popupTextureUrl)
    event.notificationTextureUrl = addHostToPath(event.notificationTextureUrl)
    event.particlesTextureUrl = addHostToPath(event.particlesTextureUrl)
  })
  return events as Event[]
}
export async function getEventsForCrud(): Promise<any> {
  const events: any = <any>(await getEvents(undefined, true))
  const rule =  {
    type: 'unique',
    start: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    end: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
  }
  const newEvent =
  {
    "id": -1,
    "eventType": "generic",
    "name": "New Event",
    "rule": JSON.stringify(rule),
    "duration": 0,
    "active": 1,
    "popupMessage": "",
    "popupTextureUrl": "",
    "notificationMessage": "",
    "notificationTextureUrl": "",
    "particlesTextureUrl": "",
    "skinId": -1,
    "devOnly": 1,
    "data": "",
    "multiplier": 1,
    // "betPrice": await getSetting('betPrice', 1)
  }
  console.log('events', events)
  // return { events: events.filter(e => String(e.rule).includes('daily')), newEvent }
  return { events, newEvent }
}

type EventDto = Event &
{
  skin?: any,
  skinId?: number,
  name?: string,
  notificationFile?: any,
  particlesFile?: any,
  popupFile?: any,
  id: number,
  popupTextureUrl?: string | undefined,
  notificationTextureUrl?: string | undefined
  particlesTextureUrl?: string | undefined
}
export async function setEvent(eventDto: EventDto, files: { notificationFile?: any, popupFile?: any, particlesFile?: any }): Promise<any> {
  delete (eventDto as any).skin
  delete (eventDto as any).notificationFile
  delete (eventDto as any).popupFile
  delete (eventDto as any).particlesFile
  if(String(eventDto.skinId) === 'undefined') delete eventDto.skinId
  if(eventDto.name === 'New Event') throw createHttpError(BAD_REQUEST, 'Give a name to the event')
  let isNew = false
  if (String(eventDto.id) === '-1') {
    isNew = true
    delete (eventDto as any).id
  }
  console.log('setEvent', eventDto)
  if(!eventDto.devOnly) eventDto.devOnly = 0
  eventDto.particlesTextureUrl = getUrlWithoutHost(<string>eventDto.particlesTextureUrl)
  eventDto.notificationTextureUrl = getUrlWithoutHost(<string>eventDto.notificationTextureUrl)
  eventDto.popupTextureUrl = getUrlWithoutHost(<string>eventDto.popupTextureUrl) 
  const resp = await exec(`REPLACE into event set ?`, <any>eventDto)
  removeActualImage(files?.notificationFile, resp.insertId, 'notification')
  removeActualImage(files?.popupFile, resp.insertId, 'popup')
  removeActualImage(files?.particlesFile, resp.insertId, 'particles')

  let notificationFile = saveFileAndGetFilePath(files?.notificationFile, resp.insertId, 'notification')
  let popupFile = saveFileAndGetFilePath(files?.popupFile, resp.insertId, 'popup')
  let particlesFile = saveFileAndGetFilePath(files?.particlesFile, resp.insertId, 'particles') 

  eventDto.popupTextureUrl = popupFile ?? eventDto.popupTextureUrl
  eventDto.notificationTextureUrl = notificationFile ?? eventDto.notificationTextureUrl
  eventDto.particlesTextureUrl = particlesFile ?? eventDto.particlesTextureUrl
  if (isNew) eventDto.id = resp.insertId
  await exec(`REPLACE into event set ?`, <any>eventDto)
  console.log('eventDto', eventDto)
  await processEvents([eventDto] as any[])

  function removeActualImage(file: any, eventId: number, whichFile: 'notification' | 'popup' | 'particles'): void {
    if (!file) return undefined
    const eventImgPath = `/var/www/html/public/assets/img/events`
    const fileNamePart = `${whichFile}Img`
    const fileNameStartWith = `${eventId}_${fileNamePart}`
    fs.readdir(eventImgPath, (err, files) => {
      files.forEach(file => {
        if (file.startsWith(`${fileNameStartWith}`))
          unlinkSync(path.join(eventImgPath, file))
      })
    })
  }
  function saveFileAndGetFilePath(file: any, eventId: number, whichFile: 'notification' | 'popup' | 'particles'): string | undefined {
    if (!file) return undefined
    const rand = getRandomNumber(111, 10000)
    const eventImgPath = `/var/www/html/public/assets/img/events`
    const fileNamePart = `${whichFile}Img`
    const fileName = `${eventId}_${fileNamePart}_${rand}.${file.name.split('.').pop()}`
    // const fileNameWithPath = path.join(file.path, fileName)
    const oldPath = file.path
    const newPath = path.join(eventImgPath, fileName)
    const rawData = fs.readFileSync(oldPath)
    fs.writeFileSync(newPath, rawData)
    unlinkSync(oldPath)
    return `/img/events/${fileName}`
  }
  notificationFile = notificationFile ? addHostToPath(notificationFile) : undefined
  popupFile = popupFile ? addHostToPath(popupFile) : undefined
  particlesFile = particlesFile ? addHostToPath(particlesFile) : undefined
  return { notificationFile, popupFile, particlesFile, id: isNew ? resp.insertId : -1, isNew }
}

export async function deleteEvent(id: number): Promise<boolean> {
  eventsService.deleteEvent(id)
  const respDelete = await exec(`
    delete from event where id = ${id}
  `)
  await updateRulesFromDb()
  return respDelete.affectedRows === 1
}
