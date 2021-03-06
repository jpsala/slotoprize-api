import { utc } from 'moment'
import PubSub from 'pubsub-js'
import { wsServer , ExtWebSocket , WebSocketMessage } from '../slot.services/webSocket/ws.service'
import { getUserSpinRegenerationData } from '../slot.repo/spin.regeneration.repo'
import { getSetting } from './../slot.services/settings.service'



// type Message = { command: 'getSpinTimer', eventType: string, client: WebSocket }

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const runCommand = async (cmd: string, data: any): Promise<void> => {
  const userSpinRegenerationData = getUserSpinRegenerationData(data.client.user.id)
  console.log('userSpinRegenerationData', userSpinRegenerationData, data.client.user.id)
  const client: ExtWebSocket = data.client
  const maxSpinsForSpinRegeneration = Number(await getSetting('maxSpinsForSpinRegeneration', '10'))
  const lapseForSpinRegeneration = Number(await getSetting('lapseForSpinRegeneration', '10')) * 1000
  const lastMoment = utc(userSpinRegenerationData.last)
  const nowMoment = utc(new Date())
  let diff = nowMoment.diff(lastMoment.utc())
  if (diff > lapseForSpinRegeneration || userSpinRegenerationData.spins >= maxSpinsForSpinRegeneration)
    diff = 0
  // TODO usar sendEventToClient() en spin.regeneration.repo (ver que no mande spinsRegenerated en 0)
  const wsMessage: WebSocketMessage = {
    code: 200,
    message: 'OK',
    msgType: 'spinTimer',
    payload: {
      spins: userSpinRegenerationData.spinsRegenerated,
      spinsInWallet: userSpinRegenerationData.spins,
      pendingSeconds:  diff > 0 ?  Math.trunc((lapseForSpinRegeneration - diff) / 1000) : -1
    }
  }
  delete data.command
  delete data.client
    try {
      wsServer.sendToUser(wsMessage, client.user.id)
    } catch (error) {
      wsServer.sendToUser(error, client)

    }
}

PubSub.subscribe('getSpinTimer', runCommand)