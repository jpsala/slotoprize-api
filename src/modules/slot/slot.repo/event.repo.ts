import { exec } from '../../../db'
import { EventDTO } from './../slot.services/events/event'

export async function addEvent(eventRule: EventDTO): Promise<void> {
  console.log('eventRule', eventRule)
  await exec('insert into event set ?', eventRule)
}