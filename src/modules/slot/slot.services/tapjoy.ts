/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable babel/no-unused-expressions */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import crypto from 'crypto'
import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import { exec } from '../../../db'
import { log } from '../../../log'
import { getGameUser } from '../../meta/meta.repo/gameUser.repo'
import { getWallet, updateWallet } from './wallet.service'
import { WebSocketMessage, wsServer } from './webSocket/ws.service'
const SECRET_KEY = '6UhYgQU0H8OWd2uILWFH'

export async function tapjoyCallback(
  options: { id: string, snuid: string, currency: string, mac_address: string, verifier: string, paymentType: string },
  isDev = false): Promise<any>
{
  
  if (!options.snuid || !options.currency || (!isDev && !options.verifier) || !options.paymentType) {
    log.error('Please check the parámeters', options)
    throw createHttpError(BAD_REQUEST, 'Please check the parameters')
  }
/*
  currency: "1",
  display_multiplier: "1.0",
  id: "42f1dba5-a6b0-4158-910f-30be9c6c558d",
  mac_address: "",
  secret_key: "6UhYgQU0H8OWd2uILWFH",
  snuid: "1cbcbb49ac58f788c5ca5d04991098e79d8c24bd1455797ba54b6288015...",
  verifier: "6c804156e1fb43328c54beefb8a53916"
*/
  const userId = options.snuid
  const id = options.id
  const currency = options.currency
  const mac_address = options.mac_address
  const paymentType = options.paymentType
  const verifier = options.verifier
  const stringToHash = `${id}:${userId}:${currency}:${SECRET_KEY}`
  const md5 = crypto.createHash('md5').update(stringToHash).digest("hex")

  console.log('log md5 is', md5)
    
  if (!isDev && md5 !== verifier) throw createHttpError(BAD_REQUEST, 'IronSource callback: MD5 does not match')

  console.log('ID %O, userId %O, currency %O,mac_address %O ', id, userId, currency, mac_address)

  const user = await getGameUser(Number(userId))
 
  if (!user) throw createHttpError(BAD_REQUEST, 'tapjoy: User not found')
  
  if (isDev && !user.isDev) throw createHttpError(BAD_REQUEST, 'User is not authrorized')

  const wsMessage: WebSocketMessage = {
    code: 200,
    message: 'OK',
    msgType: 'adReward',
    payload: {
      type: paymentType.slice(0, -1),
      amount: currency
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