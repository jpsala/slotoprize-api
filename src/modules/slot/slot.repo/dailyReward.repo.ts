import { StatusCodes } from 'http-status-codes'
import moment from 'moment'
import createHttpError from 'http-errors'
import { getWallet } from '../slot.services/wallet.service'
import { getLastSpinDays } from '../slot.services/gameInit/dailyReward.spin'
import { Chest, ChestChestType, getChestChestTypes, getChests, getDailyRewardChests, isChestClaimed } from '../slot.services/chest.service'
import { getGameUserByDeviceId } from './../../meta/meta-services/meta.service'
import { GameUser } from './../../meta/meta.types'
import { query, queryOne, queryExec } from './../../../db'
import { addToWallet, updateWallet } from './wallet.repo'

export type SpinData = { last: Date, days: number, lastClaim: Date }
export const getLastSpin = async (user: GameUser): Promise<SpinData | undefined> => {
  const row = await queryOne(`select * from last_spin where game_user_id = ${user.id} order by id limit 1`)
  if (!row) return undefined
  const spinData: SpinData = { days: Number(row.days), last: new Date(row.last), lastClaim: new Date(row.last_claim) }
  return spinData
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
export const getDailyRewardPrizesForCrud = async (): Promise<{rewards: DailyRewardPrize[], chests: Chest[], chestTypes: ChestChestType[]}> => {
  const chests = await getDailyRewardChests()
  const rows =  (await query(`select * from daily_reward order by id asc`)) as DailyRewardPrize[]
  const chestTypes = await getChestChestTypes()

  return {rewards: rows, chests, chestTypes }
}
export const setDailyRewardPrize = async (reqData: DailyRewardPrize): Promise<number> => {
  const isNew = reqData.id === -1
  if(Number(reqData.amount) < 1) throw createHttpError(StatusCodes.BAD_REQUEST, 'Amount has to be a valid integer bigger than 1')
  if(reqData.type === '') throw createHttpError(StatusCodes.BAD_REQUEST, 'Type has to be coin, ticket or spin')
  if (isNew) {
    delete reqData.id
    const resp = await queryExec(`insert into daily_reward set ?`, reqData)
    return resp.insertId
  }
  await queryExec(`update daily_reward set ? where id = ${<number> reqData.id}`, reqData)
  return <number> reqData.id
}
export const deleteDailyRewardPrize = async (id: number): Promise<void> => {
  await query(`delete from daily_reward where id = ${id}`)
}
export const getUserPrize = async (user: GameUser): Promise<DailyRewardPrize | undefined> => {
  const lastSpin = await getLastSpin(user)
  if (lastSpin == null) return undefined
  const prizes = await getDailyRewardPrizes()
  if (lastSpin.days >= prizes.length) lastSpin.days = prizes.length - 1
  return prizes[lastSpin.days]
}
export const isDailyRewardClaimed = async (deviceId: string): Promise<boolean> => {
  const user = await getGameUserByDeviceId(deviceId)
  if (user == null) throw createHttpError(StatusCodes.BAD_REQUEST, 'there is no user with that deviceID')
  const lastSpin = await getLastSpin(user)
  if (lastSpin == null) return false
  const lastClaimDate = moment(lastSpin?.lastClaim)
  const now = moment(new Date())
  const diff = now.diff(lastClaimDate, 'days')
  return diff === 0
}

export const dailyRewardClaim = async (deviceId: string): Promise<any> => {

  const user = await getGameUserByDeviceId(deviceId)
  if (user == null) throw createHttpError(StatusCodes.BAD_REQUEST, 'there is no user with that deviceID')

  const isClaimed = await isDailyRewardClaimed(deviceId)
  if (isClaimed) throw createHttpError(StatusCodes.BAD_REQUEST, 'The daily reward was already claimed')

  const userPrize = await getUserPrize(user)
  if (!userPrize) throw createHttpError(StatusCodes.BAD_REQUEST, 'User have no daily reward')

  console.log('dailyRewardClaim `${userPrize.type}s`', `${userPrize.type}s`, userPrize.amount)

  let wallet = await getWallet(user)
  const rewardType = '`${userPrize.type}s`'
  wallet = addToWallet(wallet, rewardType, userPrize.amount)
  await updateWallet(user, wallet)

  await queryExec(`update last_spin set last_claim = ? where game_user_id = ?`, [new Date(), user.id])

  //URGENT todo 
  //guardo acá la billetera que voy a devolver
  const walletData = { coins: wallet.coins, tickets: wallet.tickets, spins: wallet.spins }
  // la lógica de los chest
  // totalLogsClaimed++
  // busco el chest que corresponde a totalLogsClaimed
  // valido que no esté claimed
  // le otorgo los rewards al usuario
  // marco como claimed
  const chestGrantedId = -1 //al ID del chest otorgado al usuaro o -1 si no se le otorgó ninguno
  return {walletData, chestGrantedId}
}
export const dailyRewardInfo = async (deviceId: string): Promise<void> => {
  const user = await getGameUserByDeviceId(deviceId)
  if (user == null) throw createHttpError(StatusCodes.BAD_REQUEST, 'there is no user with that deviceID')
  const isClaimed = await isDailyRewardClaimed(deviceId)
  if (isClaimed) throw createHttpError(StatusCodes.BAD_REQUEST, 'The daily reward was allreaady claimed')
  const userPrize = await getUserPrize(user)
  console.log('Claimed %o, prize %o', isClaimed, userPrize)
}
export const getRewardCalendar = async (user: GameUser): Promise<any> => {
  const dailyRewards: DailyRewardPrize[] = await getDailyRewardPrizes()
  const tutorialComplete = (user.tutorialComplete || 0 as number) === 1
  const dailyRewardClaimed = tutorialComplete ? (await isDailyRewardClaimed(user.deviceId)) : true
  const consecutiveLogsIdx = await getLastSpinDays(user )
  const rewardChests: Chest[] = await getChests('')
  for (const chest of rewardChests) {
    const claimed = await isChestClaimed(user.id, chest.id)
    chest.claimed = claimed
  }

  return  {
    consecutiveLogsIdx,
    totalLogsClaimed: 2,
    rewards: dailyRewards,
    dailyRewardClaimed,
    rewardChests
  }
}