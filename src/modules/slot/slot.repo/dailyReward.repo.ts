import { StatusCodes } from 'http-status-codes'
import moment from 'moment'
import createHttpError from 'http-errors'
import { getWallet } from '../slot.services/wallet.service'
import { getLastSpinDays } from '../slot.services/gameInit/dailyReward.spin'
import { Chest, ChestChestType, getChestChestTypes, getChests, getDailyRewardChests, isChestClaimed, setChestClaimed } from '../slot.services/chest.service'
import { getGameUserByDeviceId } from './../../meta/meta-services/meta.service'
import { GameUser } from './../../meta/meta.types'
import { query, queryOne, queryExec, queryScalar } from './../../../db'
import { addToWallet, updateWallet } from './wallet.repo'

export type SpinData = { last_login: Date, days: number, lastClaim: Date }
export const getLastSpin = async (user: GameUser): Promise<SpinData | undefined> => {
  const row = await queryOne(`select * from last_spin where game_user_id = ${user.id} order by id limit 1`)
  if (!row) return undefined
  const spinData: SpinData = { days: Number(row.days), last_login: new Date(row.last_login), lastClaim: new Date(row.last_claim) }
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

  //URGENT quitar luego
  //URGENT reseting last claim for user, QUITAR
  //await queryExec(`update last_spin set last_claim = NULL where game_user_id = ${user.id}`)
  // test

  const isClaimed = await isDailyRewardClaimed(deviceId)
  if (isClaimed) throw createHttpError(StatusCodes.BAD_REQUEST, 'The daily reward was already claimed')

  const userPrize = await getUserPrize(user)
  if (!userPrize) throw createHttpError(StatusCodes.BAD_REQUEST, 'User have no daily reward')

  console.log('dailyRewardClaim', `${userPrize.type}s`, userPrize.amount)

  let wallet = await getWallet(user)
  const rewardType = `${userPrize.type}s`
  wallet = addToWallet(wallet, rewardType, userPrize.amount)
  await updateWallet(user, wallet)

  const lastSpin = await getLastSpin(user)
  console.log('lastSpin?.days', lastSpin?.days)
  if(lastSpin?.days === undefined) throw createHttpError(StatusCodes.BAD_REQUEST, 'Error getting last spin date')
  //URGENT todo 
  //guardo acá la billetera que voy a devolver
  const walletData = { coins: wallet.coins, tickets: wallet.tickets, spins: wallet.spins }

  await queryExec(`update last_spin set last_claim = ? where game_user_id = ?`, [new Date(), user.id])

  // la lógica de los chest

  let totalLogsClaimed = await getTotalLogsClaimed(user) 
  console.log('totalLogsClaimed', totalLogsClaimed)
  totalLogsClaimed += 1

  const chests = await getChests('rewardCalendar')
  let claimedChest: Chest | undefined
  for (const chest of chests) {
    const claimed = await isChestClaimed(user.id, chest.id)
    console.log('totalLogsClaimed >= chest.amount', totalLogsClaimed, chest.amount)
    if(!claimed && totalLogsClaimed >= chest.amount){
      claimedChest = chest
      console.log('chest to claim', claimedChest)
      break
    }
  }
  let chestGrantedId = -1 //al ID del chest otorgado al usuaro o -1 si no se le otorgó ninguno
  if(claimedChest){
    chestGrantedId = claimedChest.id
    await setChestClaimed(user.id, claimedChest.id)
    let wallet = await getWallet(user)
    for (const reward of claimedChest.rewards) 
      wallet = addToWallet(wallet, `${reward.type}s`, reward.amount)
    
    await updateWallet(user, wallet) //este wallet no se devuelve, el wallet tiene que ser sin los cambios del chest
  }

  await queryExec(`
    update last_spin set total_logs_claimed = ?
    where game_user_id = ?
`, [totalLogsClaimed, user.id])

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
  const dailyRewardClaimed = user.tutorialComplete ? (await isDailyRewardClaimed(user.deviceId)) : true
  const consecutiveLogsIdx = await getLastSpinDays(user )
  const rewardChests: Chest[] = await getChests('rewardCalendar')
  for (const chest of rewardChests) {
    const claimed = await isChestClaimed(user.id, chest.id)
    chest.claimed = claimed
  }
  const totalLogsClaimed = await getTotalLogsClaimed(user) 
  

  return  {
    consecutiveLogsIdx,
    totalLogsClaimed,
    rewards: dailyRewards,
    dailyRewardClaimed,
    rewardChests
  }
}

export async function getTotalLogsClaimed(user: GameUser): Promise<number> {
  return Number(await queryScalar(`
    select total_logs_claimed
      from last_spin
    where game_user_id = ?
  `, [user.id]))
}
