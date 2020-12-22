import createHttpError from "http-errors"
import { StatusCodes } from "http-status-codes"
import { query, queryExec, queryScalar } from "../../../db"
import { deleteProps, isValidPaymentType  } from "../../../helpers"


export type ChestReward = {id: number, chestId: number, type: string, amount: number} 
export type ChestChestType = {id: number, name: string}
export type ChestType = 'regular' | 'premium' | 'rewardCalendar' // internal_type in chest table
export type Chest = {
  id: number,
  chestTypeId: number,
  type: ChestType,
  amount: number,
  currency: string,
  chestType: string,
  rewards: ChestReward[],
  claimed? : boolean
}
export type ChestCL = Omit<Chest, "type, chestType, claimed">
export const getChests = async(internalType: ChestType): Promise<Chest[]> => {
  const chests = (await query(
    `select c.id, c.amount, c.currency, ct.id chestTypeId, ct.name chestType, c.internal_type type
      from chest c
        inner join chest_type ct on ct.id = c.chest_type_id
      where c.internal_type = ?`, 
    [internalType]
  )) as Chest[]
  for (const chest of chests) 
    chest.rewards = (await query(`
      select id, amount, reward_type type 
        from chest_reward where chest_id = ${chest.id}
    `))
  
  return chests
}

export const postChest = async(chest: Chest): Promise<number> => {
  if(chest.amount < 1 || chest.currency === '') throw createHttpError(StatusCodes.BAD_REQUEST, 'Invalid Chest Data')
  
  if(chest.rewards && chest.rewards.length > 0)
  
  for (const reward of chest.rewards) 
  if(Number(reward.amount) < 1 || !isValidPaymentType(reward.type)) throw createHttpError(StatusCodes.BAD_REQUEST, 'Invalid Reward Data')
/* CHEST
    "id": 2,
    "internal_type": "premium",
    "amount": 50,
    "currency": "spin",
    "chest_type_id": 2

    amount: 50
    currency: "spin"
    chestTypeId: 2
    id: 2

    chestType: "golden"
    rewards: [{id: 7, amount: 1, type: "spin"}, {id: 8, amount: 2, type: "coin"}]
    type: "premium"
*/

    let chestId: number = chest.id
    console.log('chest', chest)
    if(chest.id && Number(chest.id >= 0)){
      await queryExec(`
        update chest 
          set amount = ?, currency = ?, chest_type_id = ?, internal_type = ?
        where id = ?`,
        [chest.amount, chest.currency, chest.chestTypeId, chest.type, chest.id]
      )
      await queryExec(`delete from chest_reward where chest_id = ?`, [chest.id])
  } else {
    const resp = await queryExec(`insert into chest(amount, currencty, chest_type_id, internal_type) values (?,?,?)`,
      [chest.amount, chest.currency, chest.chestTypeId, chest.type]
    )
    chestId = resp.insertId
  }
  if(chest.rewards && chest.rewards.length > 0)
    for (const reward of chest.rewards) 
      await queryExec(`insert into chest_reward(chest_id, amount, reward_type) values (?, ?, ?)`,
        [chest.id, reward.amount, reward.type]
      )

  return chestId

}

export const getChestChestTypes = async(): Promise<ChestChestType[]> => {
  const chestTypes = (await query(`select id, name from chest_type`)) as ChestChestType[]
  if(chestTypes && chestTypes.length < 4) throw createHttpError(StatusCodes.BAD_REQUEST, `Missing chest types, expecting 4, found ${chestTypes.length}`)
  if(!chestTypes)
    for (const type of ['blue', 'golden', 'pig', 'redGift']) 
      await queryExec(`insert into chest_type(name) values(?)`, [type])
    
  
  return chestTypes
}

export const isChestClaimed = async (userId: number, chestId: number): Promise<boolean> => {
  const claimId = (await queryScalar(`select id from game_user_chest where game_user_id = ? and chest_id = ?`,
    [
      userId, chestId
    ])
    )
  return (claimId && Number(claimId) >= 0) ? true : false
}

export const setChestClaimed = async (userId: number, chestId: number): Promise<void> => {
  await queryExec(`insert into game_user_chest(game_user_id, chest_id) values (?,?)`,
    [
      userId, chestId
    ])
}

export const getDailyRewardChests = async (): Promise<Chest[]> => {
  let dailyRewardChests = await getChests('rewardCalendar') 
  if(dailyRewardChests && dailyRewardChests.length > 0 && dailyRewardChests.length < 4) throw createHttpError(StatusCodes.BAD_REQUEST, 'Missing Chests for daily reward')
  if(dailyRewardChests.length === 0){
    const chestTypes = await getChestChestTypes()
    for (const type of chestTypes) 
      await queryExec(`insert into chest
        (internal_type, chest_type_id, currency, amount) values (?,?,?,?)`,
        ['', type.id, 'coin', 0])
  }
  dailyRewardChests = await getChests('rewardCalendar') 

  return dailyRewardChests
}
export const getRegularChest = async (): Promise<Chest> => {
  const chests = (await getChests('regular'))
  const chestTypeRegular = await getFirstChestType()
  let regularChest: Chest = {id: -1, amount: 0, rewards: [], currency: '', type: 'regular', chestType: '', chestTypeId: chestTypeRegular.id}

  if(chests){
    regularChest = chests[0]
  } else{
    const resp = await queryExec(`insert into chest(amount, currencty, chest_type) values (?,?,?)`,
    [0, '', 'regular'])
    regularChest.id = resp.insertId
  }
  if(!regularChest.rewards || regularChest.rewards.length === 0) regularChest.rewards = []
  return regularChest
}
export const getPremiumChest = async (): Promise<Chest> => {
  const chests = (await getChests('premium'))
  const chestTypeFirst = await getFirstChestType()
  let premiumChest: Chest = {id: -1, amount: 0, rewards: [], currency: '', type: 'premium', chestType: '', chestTypeId: chestTypeFirst.id}

  if(chests){
    premiumChest = chests[0]
  } else{
    const resp = await queryExec(`insert into chest(amount, currencty, chest_type_id, internal_type) values (?,?,?,?)`,
    [0, '', 'premium', chestTypeFirst.id])
    premiumChest.id = resp.insertId
  }
  if(!premiumChest.rewards || premiumChest.rewards.length === 0) premiumChest.rewards = []
  return premiumChest
}

async function getFirstChestType(): Promise<ChestChestType> {
  const chestTypes = (await getChestChestTypes())
  if(!chestTypes) throw createHttpError(StatusCodes.BAD_REQUEST, `No chest types in DB`)
  return chestTypes[0]
}

export function chestToChestCL(chest: Chest): ChestCL {
  return deleteProps(chest, ['chestTypeId', 'type']) as ChestCL
}