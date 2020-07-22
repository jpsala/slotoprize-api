import createError from 'http-errors'
import statusCodes from 'http-status-codes'
import moment from 'moment'
import { getGameUserByDeviceId } from './../../meta/meta-services/meta.service'
import { Wallet } from './../../meta/models/wallet'
import { GameUser } from './../../meta/meta.types'
import { query, queryOne, exec } from './../../../db'

export type SpinData = {last: Date, days: number}
export const getLastSpin = async (user: GameUser): Promise<SpinData | undefined> => {
  const row = await queryOne(`select * from last_spin where game_user_id = ${user.id}`)
  if(!row) return undefined
  const spinData: SpinData = {days: Number(row.days), last: new Date(row.last), lastClaim: new Date(row.last_claim)}
  return spinData
}
export const setSpinData = async (user: GameUser): Promise<number> => {
  const row = await queryOne(`select * from last_spin where game_user_id = ${user.id}`)
    if (!row)
      await exec(`insert into last_spin(last,days,game_user_id) values(?,?,?)`,
        [ new Date(), 0, user.id ])
    let days = row?.days ?? 0
    const last = moment(row?.last ?? new Date())
    const now = moment(new Date())
    const diff = now.diff(last, 'days')
    if (diff === 0) return 0
    if (diff > 1)
      days = 0
    else
      days++
    await exec(`update last_spin set last=?, days=? where game_user_id=?`,
      [new Date(), days, user.id])
  return diff
}
export type DailyRewardPrize = {type: string, amount: number}
export const getDailyRewardPrizes = async (): Promise<DailyRewardPrize[]> => {
  const rows = await query(`select * from daily_reward order by id asc`)
  if(!rows) throw new Error('No DailyRewardPrizes in DB')
  const dailyRewardPrizes: DailyRewardPrize[] = []
  rows.forEach(row => {
    dailyRewardPrizes.push({ type: row.type, amount: Number(row.amount) })
  })
  return dailyRewardPrizes
}
export const getUserPrize = async(user: GameUser): Promise<DailyRewardPrize | undefined> => {
  const lastSpin = await getLastSpin(user)
  if(lastSpin == null) return undefined
  const prizes = await getDailyRewardPrizes()
  if (lastSpin.days < 1 || lastSpin.days > prizes.length) return undefined
  return prizes[lastSpin.days-1]
}
export const dailyRewardClaimed = async(deviceId: string): Promise<Partial<Wallet>> => {
  const user = await getGameUserByDeviceId(deviceId)
  if(user == null) throw createError(statusCodes.BAD_REQUEST, 'there is no user with that deviceID')
  const lastSpin = await getLastSpin(user)
  // log
}
export const dailyRewardClaim = async(deviceId: string): Promise<Partial<Wallet>> => {
  const user = await getGameUserByDeviceId(deviceId)
  if(user == null) throw createError(statusCodes.BAD_REQUEST, 'there is no user with that deviceID')
  const userPrize = await getUserPrize(user)
  console.log('userPrize', userPrize)
  if(!userPrize) throw createError(statusCodes.BAD_REQUEST,'User have no daily reward')
  const wallet = await queryOne(`select * from wallet where game_user_id = ?`, [user.id] ) as Wallet
  wallet[`${userPrize.type}s`] += userPrize.amount
  await exec(`update wallet set ${userPrize.type}s = ?`, [wallet[`${userPrize.type}s`]] )
  return {coins: wallet.coins, tickets: wallet.tickets}
}