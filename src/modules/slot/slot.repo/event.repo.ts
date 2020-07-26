import { exec } from '../../../db'
import { Event } from './../slot.services/events/events'

export async function addEvent(eventRule: Event): Promise<void> {
  await exec('insert into event set ?', eventRule)
}