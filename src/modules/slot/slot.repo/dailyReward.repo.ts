import { GameUser } from './../../meta/meta.types'
import { query, queryOne } from './../../../db'
export type SpinData = {last: Date, days: number}
export const getLastSpin = async (user: GameUser): Promise<SpinData | undefined> => {
  const row = await queryOne(`select * from last_spin where game_user_id = ${user.id}`)
  if(!row) return undefined
  const spinData: SpinData = {days: Number(row.days), last: new Date(row.last)}
  return spinData
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
  return prizes[lastSpin.days]
}