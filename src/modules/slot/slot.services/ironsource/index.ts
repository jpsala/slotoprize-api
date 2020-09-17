import WebSocket from 'ws'
import { getUserById } from '../../../meta/meta-services'
import { getWallet, updateWallet } from '../wallet.service'
import { WebSocketMessage, wsServer } from '../webSocket/ws.service'

export function callback(query) {

  console.log('ironSource data:', query)

  const userid = query[USER_ID]
  const currency = query.currency
  const rewards = query[REWARDS]
  const user = await getUserById(userId)
  const wallet = await getWallet(user)
  console.log('wallet before', wallet)
  wallet[currency]+= rewards
  await updateWallet(user, wallet)
  const walletAfter = await getWallet(user)
  console.log('wallet after', walletAfter)

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
    wsServer.sendToUser(wsMessage, client.userId)
  } catch (error) {
    wsServer.sendToUser(error, client)
  }

  return `${query.EVENT_ID}:OK`

}
