/* eslint-disable @typescript-eslint/restrict-template-expressions */
import crypto, { Utf8AsciiLatin1Encoding } from 'crypto'
import queryString from 'querystring'
import { format } from 'util'
import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import { queryExec } from '../../../db'
import { getGameUser } from '../../meta/meta.repo/gameUser.repo'
import { WebSocketMessage, wsServer } from './webSocket/ws.service'
export type QueryParams = {user_id: number,  amount: number, paymentType: 'coins' | 'spins' | 'tickets' }

export async function appodealCallbackPlain(queryParams: QueryParams): Promise<any> {
  console.log('queryParams', queryParams)
  if (!queryParams || !queryParams['user_id'] || !queryParams['paymentType'] || !queryParams['amount'])
    throw createHttpError(BAD_REQUEST, 'You have an error in the body')
  if (!['spins', 'coins', 'tickets'].includes(queryParams['paymentType']))
    throw createHttpError(BAD_REQUEST, 'paymentType is incorrect')
  queryParams['currency'] = queryParams['paymentType']
  await appodealCallback(undefined, undefined, queryParams)
  return {status: 'ok'}
}

export async function appodealCallback(data1?: string, data2?: string, queryParams?: QueryParams): Promise<any> {
  if ((!data1 || !data2) && !queryParams)
    throw createHttpError(BAD_REQUEST, 'Please check the parámeters')
  if (data1 && data2) {
    const encryptionKey = "encryptionKeyForAppodeal9405"
    const keyBytes = crypto.createHash('sha256').update(encryptionKey, 'utf-8' as Utf8AsciiLatin1Encoding).digest()
    const ivBytes = Buffer.from(data1, "hex")
    const cipher = crypto.createDecipheriv('aes-256-cbc', keyBytes, ivBytes)
    const decrypted = cipher.update(data2, 'hex', 'utf8') + cipher.final('utf8')
    queryParams =<any> queryString.parse(decrypted) as QueryParams
  }
  
  if(!queryParams) return
  
  const userId = queryParams["user_id"]
  const amount = queryParams["amount"]
  const currency = queryParams["currency"]
  const impressionId = queryParams["impression_id"]
  const timestamp = queryParams["timestamp"]
  const hash = queryParams["hash"]

  const hashString = queryParams ? false : crypto.createHash('sha1').update(format("user_id=%s&amount=%s&currency=%s&impression_id=%s&timestamp=%s", userId, amount, currency, impressionId, timestamp)).digest('hex')

  if(queryParams)
    console.log('appodeal: userId %O, amount %O, currency %O', userId, amount, currency)
  else
    console.log('appodeal: userId %O, amount %O, currency %O, impressionId %O, timestamp %O hash %o', userId, amount, currency, impressionId, timestamp, hash)

  if (queryParams || (hashString && (<string>hash).toUpperCase() === hashString.toUpperCase())){
    const user = await getGameUser(Number(userId))
    if (!user) throw createHttpError(BAD_REQUEST, 'User not found')
    
    const wsMessage: WebSocketMessage = {
      code: 200,
      message: 'OK',
      msgType: 'adReward',
      payload: {
        type: currency === 'Spins' as string ? 'spin' : 'coin',
        amount
      }
    }
    // Real time websocket event send
    // wsServer.sendToUser(wsMessage, Number(userId))
    // console.log('sended to user', userId)

    try {
      await queryExec(`
        insert into user_on_connect(game_user_id, jsonMsg) values(?, ?)
      `, [userId, JSON.stringify(wsMessage)])
      // wsServer.sendToUser(wsMessage, Number(userId))
    } catch (error) {
      wsServer.sendToUser(error, userId)
    }


    // @TODO Validate amount and currency
    // @TODO Check impression_id for uniqueness
    console.log(`appodeal user ${user.id}/${user.deviceId}, ${currency} ${amount}`)
    return {status: 'ok'}
  }
}