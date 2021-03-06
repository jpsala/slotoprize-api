// #region Imports
import later from '@breejs/later'
import { add, formatDuration, intervalToDuration } from 'date-fns'
import { raffleTime } from '../../../meta/meta.repo/raffle.repo'
import { isValidJSON, toBoolean } from '../../../../helpers'
import { WebSocketMessage, wsServer } from './../webSocket/ws.service'
import { getSkin, Skin } from './../../slot.repo/skin.repo'
// #endregion
//#region interface
export type EventType = 'raffle' | 'generic'
// later.date.localTime()
export type Rule = 
  { type: 'cron', rule: string } |
  { type: 'unique', start: string, end: string } |
  { type: 'daily', hours: [{ start: string, duration: number }]} |
  { type: 'weekly', days: [{day: string, hours: [{ start: string, duration: string }]}]}
  
export interface Event
{
  eventType: EventType; 
  rule: Rule;
  duration: number;
  laterTimerHandler: later.Timer | undefined;
  endTimeoutHandler: NodeJS.Timeout | undefined;
  isActive: boolean;
  next: Date | 0;
  distance: string;
  sched: later.Schedule | undefined;
  payload: EventPayload;
  callBackForStart?(event: Event): void;
  callBackForStop?(event: Event): void;
  callBackForBeforeReload?(event: Event): void;
  callBackForBeforeDelete?(event: Event): void;
  data?: any;
}
export interface PopupData
{
  title: string,
  textureUrl: string

}
export interface NotificationData {
  message: string;
  textureUrl: string;
}
export interface ParticlesData
{
    textureUrl: string;
}

export interface EventPayload
{
  id: number;
  action: 'start' | 'stop' | 'notification';
  name: string;
  notificationData: NotificationData;
  popupData: PopupData;
  particlesData: ParticlesData;
  multiplier: number;
  // betPrice: number;
  skinData?: Skin;
  skinId?: number;
  devOnly: boolean;
}
export interface EventDTO
{
  id: number;
  name: string;
  eventType: string;
  rule: Rule;
  duration: number;
  active: number;
  popupMessage: string;
  popupTextureUrl: string;
  notificationTextureUrl: string;
  notificationMessage: string;
  particlesTextureUrl: string;
  skinId?: number;
  devOnly: number;
  skin?: Skin;
  data: string;
  multiplier: number;
  // betPrice: number;
}
//#endregion

const wsMessage: Partial<WebSocketMessage> = {
  code: 200,
  message: 'OK',
  msgType: 'events',
}

const callBackForStart = async (event: Event): Promise<void> =>
{
  const payload = event.payload
  const dateEnd = add(new Date(), { seconds: event.duration })
  const dur = intervalToDuration({ start: new Date(), end: dateEnd })
  if(event.payload.skinId) event.payload.skinData = await getSkin(event.payload.skinId)
  console.log('Event started, name %o, duration %o', payload.name, formatDuration(dur, { format: ['days', 'hours', 'minutes', 'seconds'] }))
  if (event.eventType === 'generic')
  {
    event.isActive = true
    wsMessage.payload = event.payload
    wsServer.send(wsMessage as WebSocketMessage)
  }
  else if (event.eventType === 'raffle')
  {
    console.log('start raffle event', event.payload.name, event.payload.notificationData.message)
    await raffleTime(event.data.id)
  }
}

const callBackForStop = (event): void =>
{
  const payload = event.payload as EventPayload
  console.log('Event ended, name %O, notificationData %O, payload %O', payload.name, payload.notificationData.message, payload)
  event.isActive = false
    wsMessage.payload = event.payload
    wsServer.send(wsMessage as WebSocketMessage)
}

export function createEvent(eventDto: EventDTO): Event
{
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
      action: 'stop',
      popupData: {
        title: eventDto.popupMessage,
        textureUrl: eventDto.popupTextureUrl
      },
      notificationData: {
        message: eventDto.notificationMessage,
        textureUrl: eventDto.notificationTextureUrl,
      },
      particlesData: {
        textureUrl: eventDto.particlesTextureUrl,
      },
      name: eventDto.name,
      skinId: eventDto.skinId,
      devOnly: toBoolean(eventDto.devOnly),
      multiplier: eventDto.multiplier,
      // betPrice: eventDto.betPrice
    }
  }
  return event
}
