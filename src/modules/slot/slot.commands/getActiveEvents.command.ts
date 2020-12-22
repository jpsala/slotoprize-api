import PubSub from 'pubsub-js'
import WebSocket from 'ws'
import createHttpError from 'http-errors'
import { StatusCodes } from 'http-status-codes'
import { getActiveEvents } from '../slot.services/events/events'
import { EventPayload } from '../slot.services/events/event'
import { getSkin } from '../slot.repo/skin.repo'
import { queryExec, queryOne } from '../../../db'
import { getWallet, updateWallet } from '../slot.services/wallet.service'
import { getGameUserById } from '../../meta/meta.repo/gameUser.repo'
import { log } from '../../../log'
import { toBoolean } from '../../../helpers'
import { WebSocketMessage, wsServer } from './../slot.services/webSocket/ws.service'

type Message = { payload: any, client: WebSocket }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const runCommand = async (cmd: string, data: Message): Promise<void> => {
  const userIsDev = toBoolean((data.client as any).isDev)
  const userId: string = (data.client as any).user.id

  const pendingMessagesRow = await queryOne(
  `select jsonMsg from user_on_connect where game_user_id = ${userId}`
  )
  if (pendingMessagesRow) {
    // solo appodeal y tapjoy
    const pendingMessage = JSON.parse(pendingMessagesRow.jsonMsg as string)
    if (pendingMessage) {
      log.yellow('pendingMessage', pendingMessage)
      const user = await getGameUserById(Number(userId))
      if(!user) throw createHttpError(StatusCodes.BAD_REQUEST, 'User not found in getActiveEvents command')
      const wallet = await getWallet(user)
      const paymentType = String(pendingMessage.payload.type.toLocaleLowerCase()) + 's'
      const walletAmount = Number(wallet[paymentType])
      const newAmount = walletAmount + Number(pendingMessage.payload.amount)
      wallet[paymentType] = newAmount
      await updateWallet(user, wallet)

      // @TODO que diferencia hay entre send y sendtouser
      wsServer.sendToUser(pendingMessage, Number(userId))
      await queryExec(`delete from user_on_connect where game_user_id = ${userId}`)
    }
  }
  
  const activeEvents = getActiveEvents().filter(_event => {
    if (toBoolean(_event.payload.devOnly) && !userIsDev) return false
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