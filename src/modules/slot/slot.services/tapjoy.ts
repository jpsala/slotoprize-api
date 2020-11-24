/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable babel/no-unused-expressions */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import crypto from 'crypto'
import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import { queryExec, queryOne } from '../../../db'
import { log } from '../../../log'
import { getGameUserById } from '../../meta/meta.repo/gameUser.repo'
import { WebSocketMessage, wsServer } from './webSocket/ws.service'
const SECRET_KEY = '6UhYgQU0H8OWd2uILWFH'
const EXCEPTION_403_FOR_TAPJOY = 403
export async function tapjoyCallback(
  options: { id: string, snuid: string, currency: string, mac_address: string, verifier: string, paymentType: string },
  isDev = false): Promise<any>
{
  
  if (!options.snuid || !options.currency || (!isDev && !options.verifier) || !options.paymentType) {
    log.error('Please check the parámeters', options)
    throw createHttpError(BAD_REQUEST, 'Please check the parameters')
  }

  const userId = options.snuid
  const id = options.id
  const currency = options.currency
  const mac_address = options.mac_address
  const paymentType = options.paymentType
  const verifier = options.verifier
  const stringToHash = `${id}:${userId}:${currency}:${SECRET_KEY}`
  const md5 = crypto.createHash('md5').update(stringToHash).digest("hex")
  if(!['spins', 'coins', 'tickets'].includes(paymentType.toLowerCase())) throw createHttpError(EXCEPTION_403_FOR_TAPJOY, 'paymentType has to be coins, spins or tickets')
  console.log('log md5 is', md5)
  
  if (!isDev && md5 !== verifier) throw createHttpError(EXCEPTION_403_FOR_TAPJOY, 'tapjoy callback: MD5 does not match')

  console.log('tapjoy: ID %O, userId %O, currency %O,mac_address %O ', id, userId, currency, mac_address)

  const user = await getGameUserById(Number(userId))
 
  if (!user) throw createHttpError(EXCEPTION_403_FOR_TAPJOY, 'tapjoy: User not found')
  
  if (isDev && !user.isDev) throw createHttpError(EXCEPTION_403_FOR_TAPJOY, 'User is not authrorized')

  await validateTapjoyID(id, userId, paymentType, currency)
  
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
    await queryExec(`
      insert into user_on_connect(game_user_id, jsonMsg) values(?, ?)
    `, [userId, JSON.stringify(wsMessage)])
  } catch (error) {
    wsServer.sendToUser(error, userId)
  }

  return { status: 'ok' }
}

async function validateTapjoyID(id: string, userId: string, paymentType: string, currency: string) {
  const tapjoyRow = await queryOne(`
    select * from tapjoy where tapjoy_id = ?
  `, [id])
  if (tapjoyRow)
    throw createHttpError(EXCEPTION_403_FOR_TAPJOY, 'tapjoy: duplicate transaction')
  await queryExec(`
    insert into tapjoy(user_id, tapjoy_id, payment_type, amount) values(?,?,?,?)
  `, [userId, id, paymentType, currency])
}
