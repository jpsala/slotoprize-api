/* eslint-disable @typescript-eslint/restrict-template-expressions */
import crypto, { Utf8AsciiLatin1Encoding } from 'crypto'
import queryString from 'querystring'
import { format } from 'util'
import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import { exec } from '../../../db'
import { getGameUser } from '../../meta/meta.repo/gameUser.repo'
import { getWallet, updateWallet } from './wallet.service'
import { WebSocketMessage, wsServer } from './webSocket/ws.service'
export type QueryParams = {user_id: number,  amount: number, paymentType: 'coins' | 'spins' | 'tickets' }

export async function appodealCallbackPlain(queryParams: QueryParams): Promise<void> {
  if (!queryParams || !queryParams['user_id'] || !queryParams['paymentType'] || !queryParams['amount'])
    throw createHttpError(BAD_REQUEST, 'You have an error in the body')
  queryParams['currency'] = queryParams['paymentType']
  await appodealCallback(undefined, undefined, queryParams)
}

export async function appodealCallback(data1?: string, data2?: string, queryParams?: QueryParams): Promise<void> {
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
    console.log('userId %O, amount %O, currency %O', userId, amount, currency)
  else
    console.log('userId %O, amount %O, currency %O, impressionId %O, timestamp %O hash %o', userId, amount, currency, impressionId, timestamp, hash)

  if (queryParams || (hashString && (<string>hash).toUpperCase() === hashString.toUpperCase())){
    console.log('userId', userId)
    const user = await getGameUser(Number(userId))
    if(!user) throw createHttpError(BAD_REQUEST, 'User not found')
    const wallet = await getWallet(user)
    const paymentType = String(currency).toLocaleLowerCase()
    const walletAmount = Number(wallet[paymentType])
    const newAmount = walletAmount + Number(amount)
    wallet[paymentType] = newAmount
    await updateWallet(user, wallet)

    const wsMessage: WebSocketMessage = {
      code: 200,
      message: 'OK',
      msgType: 'adReward',
      payload: {
        type: currency === 'Spins' as string ? 'spin' : 'coin',
        amount
      }
    }
  
    try {
      await exec(`
        insert into user_on_connect(game_user_id, jsonMsg) values(?, ?)
      `, [userId, JSON.stringify(wsMessage)])
      // wsServer.sendToUser(wsMessage, Number(userId))
    } catch (error) {
      wsServer.sendToUser(error, userId)
    }


    // @TODO Validate amount and currency
    // @TODO Check impression_id for uniqueness
    console.log(`appodeal user ${user.id}/${user.deviceId}, ${currency} ${amount}`)

  }
}