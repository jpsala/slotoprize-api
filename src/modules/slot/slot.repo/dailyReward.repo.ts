import createError from 'http-errors'
import statusCodes from 'http-status-codes'
import moment from 'moment'
import { getGameUserByDeviceId } from './../../meta/meta-services/meta.service'
import { Wallet } from './../../meta/models/wallet'
import { GameUser } from './../../meta/meta.types'
import { query, queryOne, exec } from './../../../db'

export type SpinData = { last: Date, days: number, lastClaim: Date }
export const getLastSpin = async (user: GameUser): Promise<SpinData | undefined> => {
  const row = await queryOne(`select * from last_spin where game_user_id = ${user.id}`)
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
export type DailyRewardPrize = { type: string, amount: number }
export const getDailyRewardPrizes = async (): Promise<DailyRewardPrize[]> => {
  const rows = await query(`select * from daily_reward order by id asc`)
  if (!rows) throw new Error('No DailyRewardPrizes in DB')
  const dailyRewardPrizes: DailyRewardPrize[] = []
  rows.forEach(row => {
    dailyRewardPrizes.push({ type: row.type, amount: Number(row.amount) })
  })
  return dailyRewardPrizes
}
export const getUserPrize = async (user: GameUser): Promise<DailyRewardPrize | undefined> => {
  const lastSpin = await getLastSpin(user)
  if (lastSpin == null) return undefined
  const prizes = await getDailyRewardPrizes()
  // console.log('lastspin', lastSpin)
  if (lastSpin.days < 1 || lastSpin.days > prizes.length) return undefined
  return prizes[lastSpin.days - 1]
}
export const isDailyRewardClaimed = async (deviceId: string): Promise<boolean> => {
  const user = await getGameUserByDeviceId(deviceId)
  if (user == null) throw createError(statusCodes.BAD_REQUEST, 'there is no user with that deviceID')
  const lastSpin = await getLastSpin(user)
  if (lastSpin == null) return false
  const lastClaimDate = moment(lastSpin?.lastClaim)
  const now = moment(new Date())
  const diff = now.diff(lastClaimDate, 'days')
  return diff === 0
}
export const dailyRewardClaim = async (deviceId: string): Promise<Partial<Wallet>> => {
  const user = await getGameUserByDeviceId(deviceId)
  if (user == null) throw createError(statusCodes.BAD_REQUEST, 'there is no user with that deviceID')
  const isClaimed = await isDailyRewardClaimed(deviceId)
  if (isClaimed) throw createError(statusCodes.BAD_REQUEST, 'The daily reward was allreaady claimed')
  const userPrize = await getUserPrize(user)
  if (!userPrize) throw createError(statusCodes.BAD_REQUEST, 'User have no daily reward')
  const wallet = await queryOne(`select * from wallet where game_user_id = ?`, [user.id]) as Wallet
  wallet[`${userPrize.type}s`] += userPrize.amount
  await exec(`update last_spin set last_claim = ? where game_user_id = ?`, [new Date(), user.id])
  await exec(`update wallet set ${userPrize.type}s = ?`, [wallet[`${userPrize.type}s`]])
  return { coins: wallet.coins, tickets: wallet.tickets }
}