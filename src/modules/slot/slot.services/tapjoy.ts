/* eslint-disable @typescript-eslint/restrict-template-expressions */
import crypto from 'crypto'
import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import { exec } from '../../../db'
import { getGameUser } from '../../meta/meta.repo/gameUser.repo'
import { getWallet, updateWallet } from './wallet.service'
import { WebSocketMessage, wsServer } from './webSocket/ws.service'
const SECRET_KEY = '6UhYgQU0H8OWd2uILWFH'
export async function tapjoyCallback(
  options: { id: string, snuid: string, currency: string, mac_address: string, verifier: string },
  isDev = false): Promise<any>
{
  if (!options.snuid || !options.currency || !options.verifier)
    throw createHttpError(BAD_REQUEST, 'Please check the parámeters')
    
  const userId = options.snuid
  const id = options.id
  const currency = options.currency
  const mac_address = options.mac_address
  const verifier = options.verifier
  const stringToHash = `${id}:${userId}:${currency}:${SECRET_KEY}`
  const md5 = crypto.createHash('md5').update(stringToHash).digest("hex")
  console.log('log md5 is', md5)
  
  if (!isDev && md5 !== verifier) throw createHttpError(BAD_REQUEST, 'IronSource callback: MD5 does not match')

  console.log('ID %O, userId %O, currency %O,mac_address %O ', id, userId, currency, mac_address)

  const user = await getGameUser(Number(userId))
  if (!user) throw createHttpError(BAD_REQUEST, 'tapjoy: User not found')

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

  console.log(`tapjoy user ${user.id}/${user.deviceId}, ${currency}`)
  return { status: 'ok' }
}