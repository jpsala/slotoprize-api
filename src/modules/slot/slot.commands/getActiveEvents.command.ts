import PubSub from 'pubsub-js'
import WebSocket from 'ws'
import { getActiveEvents } from '../slot.services/events/events'
import { EventPayload } from '../slot.services/events/event'
import { getSkin } from '../slot.repo/skin.repo'
import { exec, queryOne } from '../../../db'
import { WebSocketMessage, wsServer } from './../slot.services/webSocket/ws.service'

type Message = { payload: any, client: WebSocket }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const runCommand = async (cmd: string, data: Message): Promise<void> => {
  const userIsDev = (data.client as any).isDev
  const userId: string = (data.client as any).user.id

  const pendingMessagesRow = await queryOne(
  `select jsonMsg from user_on_connect where game_user_id = ${userId}`
  )
  if (pendingMessagesRow) {
    const pendingMessage = JSON.parse(pendingMessagesRow.jsonMsg as string)
    // @TODO que diferencia hay entre send y sendtouser
    if (pendingMessage) wsServer.sendToUser(pendingMessage, Number(userId))
    await exec(`delete from user_on_connect where game_user_id = ${userId}`)
  }

  const activeEvents = getActiveEvents().filter(_event => {
    if (_event.payload.devOnly && !userIsDev) return false
    return true
  })
  const wsMessages: EventPayload[] = []
  for (const event of activeEvents) {
    if(event.payload.skinId) event.payload.skinData = await getSkin(event.payload.skinId)
    wsMessages.push(event.payload)
  }
  const wsMessage: Partial<WebSocketMessage> = {
    code: 200,
    message: 'OK',
    msgType: 'eventsState',
    payload: wsMessages
  }
  wsServer.send(wsMessage as WebSocketMessage, data.client)
  }

PubSub.subscribe('getEventState', runCommand)