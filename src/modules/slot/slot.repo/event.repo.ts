/* eslint-disable @typescript-eslint/restrict-template-expressions */
import path from 'path'
import fs, { unlinkSync } from 'fs'
import os from 'os'
import { getRandomNumber } from './../../../helpers'
import { getSetting } from './../slot.services/settings.service'
import { exec, query } from './../../../db'
import { EventDTO, Event } from './../slot.services/events/event'

export async function addEvent(eventRule: EventDTO): Promise<void>
{
  console.log('eventRule', eventRule)
  await exec('insert into event set ?', eventRule)
}
export async function getEvents(eventId?: number, onlyGeneric = false): Promise<Event[]>
{
  let where = eventId ? ` where id = ${eventId} ` : ' where true '
  where += onlyGeneric ? ` and eventType = 'generic' ` : ''
  return (await query(`select * from event ${where}`)) as Event[]
}
export async function getEventsForCrud(): Promise<any>
{
  const events: any = <any>(await getEvents(undefined, true))
  const newEvent =
  {
    "id": -1,
    "eventType": "generic",
    "name": "New Event",
    "rule": "* * * * * * *",
    "duration": 0,
    "active": 1,
    "popupMessage": "",
    "popupTextureUrl": "",
    "notificationMessage": "",
    "notificationTextureUrl": "",
    "skinId": -1,
    "devOnly": 1,
    "data": "",
    "multiplier": 1,
    "betPrice": await getSetting('betPrice', 1)
  }
  return { events, newEvent }
}

type EventDto = Event &
{
  skin?: any,
  notificationFile?: any,
  popupFile?: any,
  id: number,
  popupTextureUrl?: string | undefined,
  notificationTextureUrl?: string | undefined
}
export async function setEvent(eventDto: EventDto, files: { notificationFile?: any, popupFile?: any }): Promise<any>
{
  delete eventDto.skin
  delete eventDto.notificationFile
  delete eventDto.popupFile
  let isNew = false
  if (String(eventDto.id) === '-1')
  {
    isNew = true
    delete eventDto.id
  }

  const resp = await exec(`REPLACE into event set ?`, <any>eventDto)
  removeActualImage(files?.notificationFile, resp.insertId, 'notification')
  removeActualImage(files?.popupFile, resp.insertId, 'popup')
  const notificationFile = saveFileAndGetFilePath(files?.notificationFile, resp.insertId, 'notification')
  const popupFile = saveFileAndGetFilePath(files?.popupFile, resp.insertId, 'popup')
  eventDto.popupTextureUrl = popupFile ?? eventDto.popupTextureUrl
  eventDto.notificationTextureUrl = notificationFile ?? eventDto.notificationTextureUrl
  if(isNew) eventDto.id = resp.insertId
  await exec(`REPLACE into event set ?`, <any>eventDto)

  function removeActualImage(file: any, eventId: number, whichFile: 'notification' | 'popup'): void
  {
    if (!file) return undefined
    const eventImgPath = `/var/www/html/public/assets/img/events`
    const fileNamePart = whichFile === 'notification' ? 'notificationImg' : 'popupImg'
    const fileNameStartWith = `${eventId}_${fileNamePart}`
    fs.readdir(eventImgPath, (err, files) => {
      files.forEach(file => {
        if(file.startsWith(`${fileNameStartWith}`))
         unlinkSync(path.join(eventImgPath, file))
      })
    })
  }
  function saveFileAndGetFilePath(file: any, eventId: number, whichFile: 'notification' | 'popup'): string | undefined
  {
    if (!file) return undefined
    const rand = getRandomNumber(111, 10000)
    const eventImgPath = `/var/www/html/public/assets/img/events`
    const fileNamePart = whichFile === 'notification' ? 'notificationImg' : 'popupImg'
    const fileName = `${eventId}_${fileNamePart}_${rand}.${file.name.split('.').pop()}`
    // const fileNameWithPath = path.join(file.path, fileName)
    const oldPath = file.path
    const newPath = path.join(eventImgPath, fileName)
    const rawData = fs.readFileSync(oldPath)
    fs.writeFileSync(newPath, rawData)
    unlinkSync(oldPath)
    console.log('os.hostname()', os.hostname())
    const url = os.hostname() === 'jpnote' ? 'http://localhost' : 'http://wopidom.homelinux.com'
    return `${url}/public/assets/img/events/${fileName}`
  }
  return { notificationFile, popupFile, id: isNew ? resp.insertId : -1, isNew }
}