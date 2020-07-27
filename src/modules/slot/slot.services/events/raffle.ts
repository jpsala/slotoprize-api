import { raffleTime } from "../../../meta/meta.repo/raffle.repo"
import { Event, getNextEventById } from "./events"
interface RaffleEvent extends Event {
  date?: Date
}
const isTimeForRaffleCallback = async (event: Event) => {
  try {
    const eventData = JSON.parse(event.data)

    console.log('raffleBegin raffle event', event)
    // console.log('raffleBegin raffle event', event?.eventType, event?.description, event.next, event.distance, 1)
    if (!eventData?.id) throw new Error('isTimeForRaffleCallback, event.data.id undefined')
    await raffleTime(eventData.id)
  } catch (error) {
    throw new Error('isTimeForRaffleCallback, error parsing event.data to get raffle ID')
  }
}
export const beforeEventsReload = (_event: Event): void => {
  console.log('reload raffle event', _event?.description)
}
export function initRule(event: Event): void {
  event.callBackForStart = isTimeForRaffleCallback
  event.callBackForBeforeReload = beforeEventsReload
  console.log('raffleEvent.date', event.next, event.distance)
}
export const getNextEventDate = (event: Event): Date => {
  const nextEvent = getNextEventById(event.id)
  return nextEvent as Date
}