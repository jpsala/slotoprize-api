import { BAD_REQUEST } from 'http-status-codes'
import createHttpError from 'http-errors'
import { getWallet, updateWallet } from '../wallet.service'
import { WebSocketMessage, wsServer } from '../webSocket/ws.service'
import { getGameUser } from '../../../meta/meta.repo/gameUser.repo'
import { getSetting, setSetting } from './../settings.service'
export async function callback(query: {
    USER_ID: 'string';
    EVENT_ID: 'string';
    rewards: 'string';
    currency: 'string';
    DELIVERY_TYPE: 'string';
    AD_PROVIDER: 'string';
    publisherSubId: 'string';
    timestamp: 'string';
    signature: 'string';
    country: 'string';
    negativeCallback: 'string';
  }  ): Promise<string>
{
  console.log('ironSource data:', query)
  const eventId = query.EVENT_ID
  const userId = query.USER_ID
  const currency = query.currency
  if(!['coins', 'spins'].includes(currency)) throw createHttpError(BAD_REQUEST, 'currency has to be coins or spins')
  const rewards = Number(query.rewards)
  const user = await getGameUser(Number(userId))
  const wallet = await getWallet(user)
  const isNegativeCallback = query.negativeCallback

  // @TODO code for negative callback
  if(isNegativeCallback || ((await getSetting('last_EVENT_ID', '')) === eventId)) return `${eventId}:OK`
  await setSetting('last_EVENT_ID', eventId)
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
