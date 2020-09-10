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
  const lastMoment = utc(userSpinRegenerationData.last)
  const nowMoment = utc(new Date())
  const diff = nowMoment.diff(lastMoment.utc())
  const lapseForSpinRegeneration = Number(await getSetting('lapseForSpinRegeneration', 5000))

  const wsMessage: WebSocketMessage = {
    code: 200,
    message: 'OK',
    msgType: 'getSpinTimer',
    payload: {
      spins: userSpinRegenerationData.spins,
      pendingMiliseconds: lapseForSpinRegeneration - diff
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