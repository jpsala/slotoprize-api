/* eslint-disable @typescript-eslint/restrict-template-expressions */
import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import { exec } from '../../../db'
import { getGameUser } from '../../meta/meta.repo/gameUser.repo'
import { getWallet, updateWallet } from './wallet.service'
import { WebSocketMessage, wsServer } from './webSocket/ws.service'

export async function tapjoyCallback(
  options: { id: string, user_id: string, currency: string, mac_address: string },
  isDev = false): Promise<any>
{
  if (!options.user_id || !options.currency)
    throw createHttpError(BAD_REQUEST, 'Please check the parámeters')

  const userId = options.user_id
  const id = options.id
  const currency = options.currency
  const mac_address = options.mac_address

  console.log('ID %O, userId %O, currency %O,mac_address %O ', id, userId, currency, mac_address )
  const user = await getGameUser(Number(userId))
  if(!user) throw createHttpError(BAD_REQUEST, 'User not found')
  const wallet = await getWallet(user)
  const walletAmount = Number(wallet.spins)
  const newAmount = walletAmount + Number(currency)
  wallet.spins = newAmount
  await updateWallet(user, wallet)

  const wsMessage: WebSocketMessage = {
    code: 200,
    message: 'OK',
    msgType: 'adReward',
    payload: {
      type: 'spin',
      currency
    }
  }

  try {
    await exec(`
      insert into user_on_connect(game_user_id, jsonMsg) values(?, ?)
    `, [userId, JSON.stringify(wsMessage)])
  } catch (error) {
    wsServer.sendToUser(error, userId)
  }


  // @TODO Validate amount and currency
  // @TODO Check impression_id for uniqueness
  console.log(`tapjoy user ${user.id}/${user.deviceId}, ${currency}`)
  return {status: 'ok'}
}