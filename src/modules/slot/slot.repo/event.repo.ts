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
export async function setEvent(event: Event & { id: number }): Promise<void>
{
  console.log('event', event)
  if (event.id === -1)
  {
    delete event.id
    await query(`insert
    into from event set ?`, <any>event)
  }
  else
  {
    const resp = await exec(`REPLACE into event set ?`, <any>event)
    console.log('resp', resp)
  }
}