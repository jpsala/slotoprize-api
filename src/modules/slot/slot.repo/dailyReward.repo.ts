import { BAD_REQUEST } from 'http-status-codes'
import createError from 'http-errors'
import moment from 'moment'
import createHttpError from 'http-errors'
import { getWallet } from '../slot.services/wallet.service'
import { getGameUserByDeviceId } from './../../meta/meta-services/meta.service'
import { Wallet } from './../../meta/models/wallet'
import { GameUser } from './../../meta/meta.types'
import { query, queryOne, exec } from './../../../db'
import { updateWallet } from './wallet.repo'

export type SpinData = { last: Date, days: number, lastClaim: Date }
export const getLastSpin = async (user: GameUser): Promise<SpinData | undefined> => {
  const row = await queryOne(`select * from last_spin where game_user_id = ${user.id} order by id limit 1`)
  if (!row) return undefined
  const spinData: SpinData = { days: Number(row.days), last: new Date(row.last), lastClaim: new Date(row.last_claim) }
  return spinData
}
export const setSpinData = async (user: GameUser): Promise<number> => {
  const row = await queryOne(`select * from last_spin where game_user_id = ${user.id}`)
  if (!row)
    await exec(`insert into last_spin(last,days,game_user_id) values(?,?,?)`,
      [new Date(), 0, user.id])
  let days = row?.days ?? 0
  const lastMoment = moment(row?.last ?? new Date())
  const nowMoment = moment(new Date())
  const diff = nowMoment.diff(lastMoment, 'days')
  if (diff === 0) return 0
  if (diff > 1)
    days = 0
  else
    days++
  await exec(`update last_spin set last=?, days=? where game_user_id=?`,
    [new Date(), days, user.id])
  return diff
}
export type DailyRewardPrize = { id?:number, type: string, amount: number }
export const getDailyRewardPrizes = async (): Promise<DailyRewardPrize[]> => {
  const rows = await query(`select * from daily_reward order by id asc`)
  if (!rows) throw new Error('No DailyRewardPrizes in DB')
  const dailyRewardPrizes: DailyRewardPrize[] = []
  rows.forEach(row => {
    dailyRewardPrizes.push({ type: row.type, amount: Number(row.amount) })
  })
  return dailyRewardPrizes
}
export const getDailyRewardPrizesForCrud = async (): Promise<DailyRewardPrize[]> => {
  const rows =  (await query(`select * from daily_reward order by id asc`)) as DailyRewardPrize[]
  return rows
}
export const setDailyRewardPrize = async (reqData: DailyRewardPrize): Promise<number> => {
  const isNew = reqData.id === -1
  if(Number(reqData.amount) < 1) throw createHttpError(BAD_REQUEST, 'Amount has to be a valid integer bigger than 1')
  if(reqData.type === '') throw createHttpError(BAD_REQUEST, 'Type has to be coin, ticket or spin')
  if (isNew) {
    delete reqData.id
    const resp = await exec(`insert into daily_reward set ?`, reqData)
    return resp.insertId
  }
  await exec(`update daily_reward set ? where id = ${<number> reqData.id}`, reqData)
  return <number> reqData.id
}
export const deleteDailyRewardPrize = async (id: number): Promise<void> => {
  await query(`delete from daily_reward where id = ${id}`)
}
export const getUserPrize = async (user: GameUser): Promise<DailyRewardPrize | undefined> => {
  const lastSpin = await getLastSpin(user)
  if (lastSpin == null) return undefined
  const prizes = await getDailyRewardPrizes()
  if (lastSpin.days >= prizes.length) lastSpin.days = prizes.length
  console.log('lastSpin.days', lastSpin.days, prizes)
  return prizes[lastSpin.days-1]
}
export const isDailyRewardClaimed = async (deviceId: string): Promise<boolean> => {
  const user = await getGameUserByDeviceId(deviceId)
  if (user == null) throw createError(BAD_REQUEST, 'there is no user with that deviceID')
  const lastSpin = await getLastSpin(user)
  if (lastSpin == null) return false
  const lastClaimDate = moment(lastSpin?.lastClaim)
  const now = moment(new Date())
  const diff = now.diff(lastClaimDate, 'days')
  return diff === 0
}
export const dailyRewardClaim = async (deviceId: string): Promise<Partial<Wallet>> => {
  const user = await getGameUserByDeviceId(deviceId)
  if (user == null) throw createError(BAD_REQUEST, 'there is no user with that deviceID')
  const isClaimed = await isDailyRewardClaimed(deviceId)
  if (isClaimed) throw createError(BAD_REQUEST, 'The daily reward was allreaady claimed')
  const userPrize = await getUserPrize(user)
  if (!userPrize) throw createError(BAD_REQUEST, 'User have no daily reward')
  const wallet = await getWallet(user)
  wallet[`${userPrize.type}s`] += userPrize.amount
  await updateWallet(user, wallet)
  await exec(`update last_spin set last_claim = ? where game_user_id = ?`, [new Date(), user.id])
  // await exec(`update wallet set ${userPrize.type}s = ?`, [wallet[`${userPrize.type}s`]])
  return { coins: wallet.coins, tickets: wallet.tickets, spins: wallet.spins }
}
export const dailyRewardInfo = async (deviceId: string): Promise<void> => {
  const user = await getGameUserByDeviceId(deviceId)
  if (user == null) throw createError(BAD_REQUEST, 'there is no user with that deviceID')
  const isClaimed = await isDailyRewardClaimed(deviceId)
  if (isClaimed) throw createError(BAD_REQUEST, 'The daily reward was allreaady claimed')
  const userPrize = await getUserPrize(user)
  console.log('Claimed %o, prize %o', isClaimed, userPrize)
}