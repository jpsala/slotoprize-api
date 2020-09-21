import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from 'http-status-codes'
import createHttpError from 'http-errors'
import { JackpotData  , PrizeWinners } from '../slot.repo/jackpot.repo'
import * as jackpotRepo from '../slot.repo/jackpot.repo'

import { query } from './../../../db'
import { sleep } from './../../../helpers'
import { GameUser } from './../../meta/meta.types'
import * as thisModule from './jackpot.service'
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
export const addJackpotNextRow = async (data: JackpotData): Promise<void> =>
{
  const jackpotNextRow = await jackpotRepo.getJackpotNextRow()
  if (jackpotNextRow) throw createHttpError(BAD_REQUEST, `There is already a jackpot cycle with state = "next"`)

  if(data.state !== 'next') data.state = 'next'
  if(data.spinCount !== 0) data.spinCount = 0
  if(data.prize === 0 && data.confirmed) throw createHttpError(BAD_REQUEST, 'Prize has to be bigger than 0 if is confirmed')
  if(data.cycle === 0 && data.confirmed) throw createHttpError(BAD_REQUEST, 'Cycle has to be bigger than 0 if is confirmed')
  await jackpotRepo.addJackpotNextRow(data)

}
export const addSpinsToJackpotLiveRow = async (amount: number, user: GameUser): Promise<boolean> =>
{
  while (spinBlocked) await sleep(10)
  spinBlocked = true
  let isJackpot = false
  try {
    await jackpotRepo.addSpinsToJackpotLiveRow(amount)
    const {spinCount, cycle} = await getJackpotLiveRow()
    isJackpot = Number(spinCount) >= Number(cycle)
    if (isJackpot) await thisModule.jackpotWin(user)
  } finally {
    spinBlocked = false
  }
  return isJackpot

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