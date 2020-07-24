import { exec } from '../../../db'
import { EventRule } from './../slot.services/events/events'

export async function addEvent(eventRule: EventRule): Promise<void>{
  await exec('insert into event set ?', eventRule)
}