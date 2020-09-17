import { getWallet, updateWallet } from '../wallet.service'
import { WebSocketMessage, wsServer } from '../webSocket/ws.service'
import { getGameUser } from '../../../meta/meta.repo/gameUser.repo'

export async function callback(query) {

  console.log('ironSource data:', query)

  const userId = query.USER_ID
  const currency = query.currency
  const rewards = Number(query.rewards)
  const user = await getGameUser(userId)
  const wallet = await getWallet(user)

  const isNegativeCallback = query.negativeCallback
  // @TODO code for negative callback
  console.log('negative', isNegativeCallback)
  if(isNegativeCallback) return `${query.EVENT_ID}:OK`

  // @TODO guardar para no procesar otra vez

  wallet[currency] += rewards
  await updateWallet(user, wallet)
  const walletAfter = await getWallet(user)

  const wsMessage: WebSocketMessage = {
    code: 200,
    message: 'OK',
    msgType: 'adReward',
    payload: {
      type: currency,
      amount: rewards
    }
  }

  try {
    wsServer.sendToUser(wsMessage, Number(userId))
    console.log('sended to user', userId)
  } catch (error) {
    wsServer.sendToUser(error, userId)
  }

  return `${query.EVENT_ID}:OK`
}
