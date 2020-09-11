import { utc } from 'moment'
import PubSub from 'pubsub-js'
import WebSocket from 'ws'
import { wsServer , ExtWebSocket , WebSocketMessage } from '../slot.services/webSocket/ws.service'
import { getUserSpinRegenerationData } from '../slot.repo/spin.regeneration.repo'
import { getSetting } from './../slot.services/settings.service'



type Message = { command: 'getSpinTimer', eventType: string, client: WebSocket }

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const runCommand = async (cmd: string, data: any): Promise<void> => {
  const userSpinRegenerationData = getUserSpinRegenerationData(data.client.userId)
  const client: ExtWebSocket = data.client
  const maxSpinsForSpinRegeneration = Number(await getSetting('maxSpinsForSpinRegeneration', 10))
  const lapseForSpinRegeneration = Number(await getSetting('lapseForSpinRegeneration', 5000))
  const lastMoment = utc(userSpinRegenerationData.last)
  const nowMoment = utc(new Date())
  let diff = nowMoment.diff(lastMoment.utc())

  if (diff > lapseForSpinRegeneration || userSpinRegenerationData.spins >= maxSpinsForSpinRegeneration)
    diff = 0

  console.log('nowMoment.diff(lastMoment.utc())', nowMoment.diff(lastMoment.utc()))
      // console.log('ok')


  const wsMessage: WebSocketMessage = {
    code: 200,
    message: 'OK',
    msgType: 'spinTimer',
    payload: {
      spins: userSpinRegenerationData.spins,
      pendingMiliseconds:  diff > 0 ? diff : 0
    }
  }
  delete data.command
  delete data.client
    try {
      wsServer.sendToUser(wsMessage, client.userId)
    } catch (error) {
      wsServer.sendToUser(error, client)

    }
}

PubSub.subscribe('getSpinTimer', runCommand)