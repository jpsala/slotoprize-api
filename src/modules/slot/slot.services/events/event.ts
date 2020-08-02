import { isArray } from 'util'
import { raffleTime } from '../../../meta/meta.repo/raffle.repo'
import { isValidJSON } from '../../../../helpers'
import wsServer, { WebSocketMessage } from './../webSocket/ws'
import { Skin } from './../../slot.repo/skin.repo'
//#region interface
export type EventType = 'raffle' | 'generic'
// later.date.localTime()
export interface Event {
  eventType: EventType;
  rule: string;
  duration: number;
  laterTimerHandler: later.Timer | undefined;
  endTimeoutHandler: NodeJS.Timeout | undefined;
  isActive: boolean;
  next: Date | 0;
  distance: string;
  sched: later.Schedule | undefined;
  payload: EventPayload | EventPayload[];
  callBackForStart?(event: Event): void;
  callBackForStop?(event: Event): void;
  callBackForBeforeReload?(event: Event): void;
  callBackForBeforeDelete?(event: Event): void;
  data?: any;
}
export interface EventPayload {
  id: number;
  name: string;
  action: 'start' | 'stop' | 'notification' | undefined;
  popupMessage: string;
  popupTextureUrl: string;
  notificationMessage: string;
  notificationTextureUrl: string;
  multiplier: number;
  betPrice: number;
  skin?: Skin;
  devOnly: boolean;
}
export interface EventDTO {
  id: number;
  name: string;
  eventType: string;
  rule: string;
  duration: number;
  active: number;
  popupMessage: string;
  popupTextureUrl: string;
  notificationTextureUrl: string;
  notificationMessage: string;
  skinId: number;
  devOnly: number;
  skin?: Skin;
  data: string;
  multiplier: number;
  betPrice: number;
}
//#endregion

const wsMessage: Partial<WebSocketMessage> = {
  code: 200,
  message: 'OK',
  msgType: 'events',
}

const callBackForStart = async(event: Event):Promise<void> => {
  event.payload = event.payload as EventPayload
  if (event.eventType === 'generic') {
    event.isActive = true
    event.payload.action = 'start'
    wsMessage.payload = event.payload
    wsServer.send(wsMessage as WebSocketMessage)
  }
  else if (event.eventType === 'raffle') {
    await raffleTime(event.data.id)
  }
}

const callBackForStop = (event): void => {
  event.payload = event.payload as EventPayload
  event.isActive = false
  event.payload.action = 'stop'
  wsMessage.payload = event.payload
  wsServer.send(wsMessage as WebSocketMessage)
}

export function createEvent(eventDto: EventDTO): Event {
  if (!['generic', 'raffle'].includes(eventDto.eventType)) throw new Error('Events createEvent, eventType invalid ' + eventDto.eventType)
  const event: Event = {
    eventType: eventDto.eventType as EventType,
    isActive: false,
    duration: eventDto.duration,
    callBackForStart,
    callBackForStop,
    rule: eventDto.rule,
    next: 0,
    laterTimerHandler: undefined,
    endTimeoutHandler: undefined,
    distance: '',
    sched: undefined,
    data: isValidJSON(eventDto.data) ? JSON.parse(eventDto.data) : undefined,
    payload: {
      id: eventDto.id,
      popupMessage: eventDto.popupMessage,
      popupTextureUrl: eventDto.popupTextureUrl,
      notificationMessage: eventDto.notificationMessage,
      notificationTextureUrl: eventDto.notificationTextureUrl,
      name: eventDto.name,
      skin: eventDto.skin,
      action: undefined,
      devOnly: eventDto.devOnly === 1,
      multiplier: eventDto.multiplier,
      betPrice: eventDto.betPrice
    }
  }
  return event
}

