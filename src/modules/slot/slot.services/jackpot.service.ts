import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from 'http-status-codes'
import createHttpError from 'http-errors'
import camelcaseKeys from 'camelcase-keys'
import { JackpotData} from '../slot.repo/jackpot.repo'
import * as jackpotRepo from '../slot.repo/jackpot.repo'
import { getHaveProfile, markGameUserForEventWhenProfileGetsFilled, unMarkGameUserForEventWhenProfileGetsFilled } from '../../meta/meta.repo/gameUser.repo'
import { queryOne } from '../../../db'
import { PrizeWinners } from './prizes.service'

import { sleep } from './../../../helpers'
import { GameUser } from './../../meta/meta.types'
import * as thisModule from './jackpot.service'
import { WebSocketMessage, wsServer } from './webSocket/ws.service'
let spinBlocked = false

export async function jackpotWin(user: GameUser): Promise<void>
{
  const jackpotNextRow = await jackpotRepo.getJackpotNextRow()
  const jackpotLiveRow = await jackpotRepo.getJackpotLiveRow()
  if(!jackpotLiveRow) throw createHttpError(INTERNAL_SERVER_ERROR, 'There is no live jackpot cycle in jackpotWin')
  if (jackpotNextRow?.confirmed) {
    await jackpotRepo.changeState(jackpotLiveRow, 'past')
    await jackpotRepo.changeState(jackpotNextRow, 'live')
  } else {
    await jackpotRepo.cleanLive(jackpotLiveRow)
  }
  await jackpotRepo.setJackpotWinned(user, jackpotLiveRow)
}
export const getJackpotData = async (): Promise<JackpotData[] | undefined>  =>
{
  const data = await jackpotRepo.getJackpotData()
  return data
}
export const getJackpotLiveRow = async (): Promise<JackpotData> =>
{
  const data = await jackpotRepo.getJackpotLiveRow()
  if(!data) throw createHttpError(BAD_REQUEST, 'There is not a live cycle in the db')
  return data
}
export const jackpotPost = async (reqData: JackpotData): Promise<any> => {
  const isNew = reqData.id === -1
  if(isNew) delete reqData.id
  console.log('post', reqData)
  reqData.cycle = Number(reqData.cycle)
  reqData.prize = Number(reqData.prize)
  if (isNew) return addJackpotNextRow(reqData)
  if (isNaN(Number(reqData.cycle))) throw createHttpError(BAD_REQUEST, 'Cycle has to be a valid integer')
  if (isNaN(Number(reqData.prize))) throw createHttpError(BAD_REQUEST, 'Prize has to be a valid number')
  if (reqData.confirmed) {
    if (reqData.cycle === 0 || isNaN(Number(reqData.cycle))) throw createHttpError(BAD_REQUEST, 'Cycle has to be a valid integer bigger than 0')
    if (reqData.prize === 0 || isNaN(Number(reqData.prize))) throw createHttpError(BAD_REQUEST, 'Prize has to be a valid number bigger than 0')
  }
  
  const resp = await jackpotRepo.updateJackpotNextRow(reqData)
  // const savedData = await jackpotRepo.getJackpotRow(<number>reqData.id)
  return resp
}
export const addJackpotNextRow = async (data: JackpotData): Promise<any> =>
{
  const jackpotNextRow = await jackpotRepo.getJackpotNextRow()
  if (jackpotNextRow) throw createHttpError(BAD_REQUEST, `There is already a jackpot cycle with state = "next"`)

  if(data.state !== 'next') data.state = 'next'
  if(data.spinCount !== 0) data.spinCount = 0
  if(data.prize === 0 && data.confirmed) throw createHttpError(BAD_REQUEST, 'Prize has to be bigger than 0 if is confirmed')
  if(data.cycle === 0 && data.confirmed) throw createHttpError(BAD_REQUEST, 'Cycle has to be bigger than 0 if is confirmed')
  return await jackpotRepo.addJackpotNextRow(data)

}
export const addSpinsToJackpotAndReturnIfIsJackpot = async (amount: number, user: GameUser):
             Promise<JackpotData & { isJackpot: boolean }> =>
{
  while (spinBlocked) await sleep(10)
  spinBlocked = true
  let isJackpot = false
  let ret: JackpotData & { isJackpot: boolean }
  try {
    await jackpotRepo.addSpinsToJackpotLiveRow(amount)
    const liveRow = await getJackpotLiveRow()
    isJackpot = Number(liveRow.spinCount) >= Number(liveRow.cycle)
    if (isJackpot) await thisModule.jackpotWin(user)
    ret = {...liveRow, isJackpot }
  } finally {
    spinBlocked = false
  }
  return ret

}
export const getNewLiveRow = async (): Promise<JackpotData | undefined> =>
{
  const nextRow = await jackpotRepo.getJackpotNextRow()
  if (nextRow?.confirmed) return nextRow
  return undefined
}

export const getJackpotWinners = async (): Promise<PrizeWinners[]> =>
{
  const winners = await jackpotRepo.getJackpotWinners()
  return winners
}

export const sendJackpotWinEvent = async (user: GameUser, jackpotRowId: number): Promise<void> => {
  const userForSaving: GameUser = camelcaseKeys(user)
  if (await getHaveProfile(user.id)) {
    const liveRow = await getJackpotLiveRow()
    const jackpotData:{prize: number} = await queryOne(`
      select id, cycle, prize, state, repeated, spinCount, confirmed
      from jackpot 
      where id = ${jackpotRowId}
    `)
    const wsMessage: WebSocketMessage = {
      code: 200,
      message: 'OK',
      msgType: 'jackpotWin',
      payload: {
        amount: jackpotData.prize,
        winnerId: userForSaving.id,
        winnerName: `${userForSaving.firstName}, ${userForSaving.lastName}`,
        winnerLocation: `${userForSaving.country}`,
        updatedAmount: liveRow.prize,
      }
    }
    wsServer.send(wsMessage)
    await unMarkGameUserForEventWhenProfileGetsFilled(userForSaving)
  } else {
      console.log('incomplete profile, marking for future send', )
      await markGameUserForEventWhenProfileGetsFilled(user, jackpotRowId)
    }
}