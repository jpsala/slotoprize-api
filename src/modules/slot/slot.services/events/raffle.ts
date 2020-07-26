import wsService from "../webSocket/ws"
import { Event, getNextEventById, getNextEvent } from "./events"

interface RaffleEvent extends Event {
  date?: Date
}
const raffleEvents: RaffleEvent[] = []

export const getRaffleEvents = (): any => {
  return raffleEvents
}

const isTimeForRaffleCallback = (event: Event) => {
  console.log('raffleBegin event', event?.eventType, event?.description, event.next, 1)
  wsService.send({
    code: 200,
    message: 'event',
    msgType: 'raffle',
    payload: event
  })
}

export const beforeEventsReload = (_event: Event): void => {
  console.log('reload event', _event?.description)
  // const idx = raffleEvents.findIndex(filteredRaffleEvent => filteredRaffleEvent.id === _event.id)

}

export function initRuleCalledFromEvents(event: Event): void {
  event.callBackForStart = isTimeForRaffleCallback
  event.callBackForBeforeReload = beforeEventsReload
  console.log('raffleEvent.date', event.next)
  raffleEvents.push(event)
}

export const getNextEventDate = (event: Event): Date => {
  const nextEvent = getNextEventById(event.id)
  return nextEvent as Date
}

