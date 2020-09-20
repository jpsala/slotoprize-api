import crypto from 'crypto'
import { BAD_REQUEST } from 'http-status-codes'
import createHttpError from 'http-errors'
import { getWallet, updateWallet } from '../wallet.service'
import { WebSocketMessage, wsServer } from '../webSocket/ws.service'
import { getGameUser } from '../../../meta/meta.repo/gameUser.repo'
import { queryOne, exec } from './../../../../db'

export async function callback(query: {
    USER_ID: string;
    EVENT_ID: string;
    rewards: string;
    currency: string;
    DELIVERY_TYPE: string;
    AD_PROVIDER: string;
    publisherSubId: string;
    timestamp: string;
    signature: string;
    country: string;
    negativeCallback: string;
  }  ): Promise<string>
{
  console.log('ironSource data:', query)
  const eventId = query.EVENT_ID
  const privateKey = 'tagadaGames2235357865'
  const userId = query.USER_ID
  const currency = query.currency
  if(!['coins', 'spins'].includes(currency)) throw createHttpError(BAD_REQUEST, 'currency has to be coins or spins')
  const rewards = Number(query.rewards)
  const user = await getGameUser(Number(userId))
  const wallet = await getWallet(user)
  const isNegativeCallback = query.negativeCallback === 'true'
  const stringToHash = `${query.timestamp}${query.EVENT_ID}${query.USER_ID}${query.rewards}${privateKey}`
  const ironSrcMD5 = crypto.createHash('md5').update(stringToHash).digest("hex")

  if(ironSrcMD5 !== query.signature) throw createHttpError(BAD_REQUEST, 'IronSource callback: MD5 does not match')

  if (isNegativeCallback) {
    console.log('Returning on negative callback' )
    return `${eventId}:OK`
  }

  const savedEventId = await setAndGetIronSourceEvent(eventId, Number(userId), currency, rewards)
  if (savedEventId) {
    console.log('Event already saved, returning')
    return `${eventId}:OK`
  }

  wallet[currency] += rewards
  await updateWallet(user, wallet)
  const wsMessage: WebSocketMessage = {
    code: 200,
    message: 'OK',
    msgType: 'adReward',
    payload: {
      type: currency === 'spins' as string ? 'spin' : 'coin',
      amount: rewards
    }
  }

  try {
    wsServer.sendToUser(wsMessage, Number(userId))
    console.log('sended to user', userId)
  } catch (error) {
    wsServer.sendToUser(error, userId)
  }

  return `${eventId}:OK`
}


const setAndGetIronSourceEvent = async (eventId: string, userId: number, currency: string, rewards: number): Promise<boolean> => {
  const resp = await queryOne(`select * from iron_source where eventId = '${eventId}'`)
  console.log('resp', resp)
  if (!resp) {
    console.log('saving event in iron_source', eventId, userId, currency, rewards)
    await exec(`insert into iron_source(eventId, userID, currency, rewards)
      values(?,?,?,?)`, [eventId, userId, currency, rewards])
    }
  return Boolean(resp)
}