import createError from 'http-errors'
import * as httpStatusCodes from 'http-status-codes'
import snakeCaseKeys from 'snakecase-keys'
import camelcaseKeys from 'camelcase-keys'
import { classToPlain } from "class-transformer"
import { RowDataPacket } from 'mysql2'
import * as metaService from '../../meta/meta-services/meta.service'
import getConnection, {queryOne, exec, query } from '../../../db'
import { LanguageData, GameUser, fakeUser, RafflePrizeData } from '../meta.types'
import { getWallet, updateWallet, insertWallet } from '../../slot/slot.services/wallet.service'
import { addHostToPath } from './../../../helpers'
import { Wallet } from './../models/wallet'
import { getSetting } from './../../slot/slot.services/settings.service'


export const getGameUserLastSpinDate = async (user: GameUser): Promise<{ last: Date }> =>
{
  let resp = await queryOne(`select last from game_user_spin where game_user_id = ${user.id}`)
  if (!resp) {
    const spinRatioTimerPlus1 = Number(await getSetting('spinRatioTimer', '8')) + 1
    const date = new Date()
    console.log('date utc', date, new Date())
    date.setSeconds(date.getSeconds() - spinRatioTimerPlus1)
    await exec(`insert into game_user_spin set ?`,
      {
        "game_user_id": user.id,
        "spinCount": 0,
        'last': date
      }
    )
    resp = { last: date }
  }

  console.log('getGameUserLastSpinDate', resp)
  return {last: resp.last}
}
export const purchaseTickets = async (deviceId: string,ticketAmount: number): Promise<Wallet> => {
  if (!deviceId) throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter')

  const user = await metaService.getGameUserByDeviceId(deviceId)
  const wallet = await getWallet(user)
  const ticketValue = Number(await getSetting('ticketPrice', '1'))
  const coinsRequired = ticketAmount * ticketValue
  if (wallet.coins < coinsRequired)
    throw createError(400, 'There are no sufficient funds')
  wallet.coins-=coinsRequired
  wallet.tickets += ticketAmount
  await updateWallet(user, wallet)
  return wallet as Wallet
}
export function toTest(msg = 'mal'): any
{
  return msg
}
export async function getLanguage(userId: number): Promise<LanguageData> {
  const localizationData = await queryOne(`
    select l.* from game_user gu
      inner join language l on l.language_code = gu.language_code
    where gu.id = ${userId}
  `, undefined, true) as LanguageData
  return localizationData
}
export async function getGameUserByDeviceId(deviceId: string): Promise<GameUser>;
export async function getGameUserByDeviceId(deviceId: string): Promise<Partial <GameUser> | GameUser>;
export async function getGameUserByDeviceId(deviceId: string): Promise<Partial <GameUser> | GameUser> {
  const userSelect = `
      select *
        from game_user
      where device_id ='${deviceId}'`
  const user = await queryOne(userSelect, undefined, false) as GameUser
  return user
}
export async function getGameUser(userId: number): Promise<GameUser> {
  const userSelect = `
    select *
    from game_user
    where id =${userId}`
  const user = camelcaseKeys(await queryOne(userSelect)) as GameUser
  if(user)
    user.wallet = await getWallet(user)
  return user
}
export async function setGameUserSpinData(userId: number): Promise<void>
{
  let spinCountResp = await queryOne(`select id, spinCount from game_user_spin where game_user_id = ${userId}`)
  console.log('changing game_user_spin')
  if(!spinCountResp) spinCountResp = {
      "game_user_id": userId,
      "spinCount": 0
    }
    await exec(`
      replace into game_user_spin set ?`, {
        "id": spinCountResp ? spinCountResp.id : null,
        "game_user_id": userId,
        "spinCount": spinCountResp?.spinCount >= 0 ? (Number(spinCountResp.spinCount )+1) : 0
      }
    )
}
export async function getLoginData(userId: number): Promise<{count: number, lastLogin: Date}> {
  const response = await queryOne(`
    select
      (select count(*) from game_user_login u where u.game_user_id = ${userId}) as count,
      (select max(u.date) from game_user_login u where u.game_user_id = ${userId}) as lastLogin`)
  return response as {count: number, lastLogin: Date}
}
export async function getWinRaffle(userId: number): Promise<Partial<RafflePrizeData>>
{
  const winData = await queryOne(`
    select r.id, if(rl.id, rl.name, 'No localization data') as name,
    if(rl.id, rl.description, 'No localization data') as description, r.closing_date as closingDate,
    r.raffle_number_price as raffleNumberPrize, r.item_highlight as itemHighlight,
    r.texture_url as textureUrl
    from raffle_history rh
      inner join raffle r on rh.raffle_id = r.id
      inner join game_user gu on r.winner = gu.id
      left join raffle_localization rl on r.id = rl.raffle_id and rl.language_code = gu.language_code
    where win = 1 and rh.game_user_id = ${userId} and notified = 0
    order by rh.id desc limit 1
  `)
  const rafflePrizeData: Partial <RafflePrizeData> = {
    id: winData.id, name: winData.name, description: winData.description,
    closingDate: winData.closingDate, raffleNumberPrice: winData.raffleNumberPrize,
    itemHighlight: winData.itemHighlight === 1, textureUrl: addHostToPath(winData.textureUrl)
  }
  console.log('rafflePrizeData', rafflePrizeData)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return rafflePrizeData
}
export async function getHaveWinRaffle(userId: number): Promise<boolean> {
  const winData = await queryOne(`
    select count(*) as win from raffle_history rh
    where win = 1 and rh.game_user_id = ${userId} and notified = 0
  `)
  return Number(winData.win) > 0
}
export async function resetPendingPrize(userId: number): Promise<void> {
  await exec(`update raffle_history set notified = 1 where game_user_id = ${userId}`)
  await exec(`update jackpot_win set notified = 1 where game_user_id = ${userId}`)
}
export async function getHaveWinJackpot(userId: number): Promise<boolean> {
  const winData = await queryOne(`
    select count(*) as win from jackpot_win jw
    where state = 'won' and jw.game_user_id = ${userId} and jw.notified = 0
  `)
  return winData.win > 0
}
export async function getHaveProfile(userId: number): Promise<boolean> {
  const profileData = await getGameUser(userId)
  console.log('profileData', profileData)
  return profileData.lastName !== "" &&
         profileData.firstName !== "" &&
         profileData.address !== "" &&
         profileData.city !== "" &&
         profileData.country !== "" &&
         profileData.email !== "" &&
         profileData.phoneNumber !== "" &&
         profileData.state !== "" &&
         profileData.title !== "" &&
         profileData.zipCode !== ""
}
export async function delUser(deviceId: string): Promise < void > {
  const user = await getGameUserByDeviceId(deviceId)
  if(!user) return
  const {id} = user
  await exec(`
    delete from game_user_login where game_user_id = ${id}
  `)
  await exec(`
    delete from wallet where game_user_id = ${id}
  `)
  await exec(`
    delete from game_user  where id = ${id}
  `)
}
type WalletDTO = {coins: number, tickets: number, game_user_id: number}

// @TODO ver de user class-transmormer abajo
export async function addGameUser(user: GameUser): Promise<GameUser> {
  const gameUserDto: Omit<GameUser, "isNew">  & {isNew?: boolean} = Object.assign({}, user)

  delete gameUserDto.isNew
  if(gameUserDto.id === -1) delete (gameUserDto as any).id
  const snakeCasedUser = snakeCaseKeys(gameUserDto)
  const wallet = snakeCasedUser.wallet
  delete snakeCasedUser.wallet
  const conn = await getConnection()
  let gameUserId: number
  await conn.beginTransaction()
  try {
      const [result] = await conn.query('insert into game_user set ?', snakeCasedUser) as RowDataPacket[]
      gameUserId = result.insertId
      gameUserDto.id = gameUserId
      let walletDTO: WalletDTO
      if (gameUserDto.wallet) {
        walletDTO = <WalletDTO>classToPlain(wallet)
        walletDTO.game_user_id = gameUserId
        await insertWallet(gameUserDto as GameUser, wallet?.coins, wallet?.spins, wallet?.tickets)
      } else {
        await insertWallet(gameUserDto as GameUser)
      }
    await conn.commit()
    } finally {
      await conn.rollback()
      conn.destroy()
    }
    return gameUserDto as GameUser
  }
export async function getNewSavedFakeUser(override: Partial<GameUser> = {}): Promise<GameUser>{
  const fakedUser = await fakeUser(override)
  const newUser = await addGameUser(fakedUser)
  return newUser
}
export async function setGameUserLogin(deviceId: string): Promise<any>
{
  const gameUser = await getGameUserByDeviceId(deviceId)
  await exec(`
    replace into game_user_login set ?
  `,
    {
      "game_user_id": gameUser.id,
      "game_id": 1,
      "device_id": deviceId
    }
  )
}
export async function setLanguageCode(userId: number, languageCode: string): Promise<{ languageCode: string }> {
  const qry = `
    update game_user set language_code = '${languageCode}'
    where id = ${userId}`
  await exec(qry)
  // const resp = await exec(qry)
  // const changed=resp.affectedRows === 1 ? 'changed' : 'dont\' changed'
  return { languageCode }
}
export const getPlayerForFront = async (id: string): Promise<any> =>
{
  const player = await queryOne(`
  select * from game_user
    where id = ${id}
` )
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return player
}
export const getPlayersForFront = async (from: number, limit: number, filter: string): Promise < any > => {
  const players = (await query(`
  select * from game_user
    where first_name like '%${filter}%' or last_name like '%${filter}%'
          or email like '%${filter}%' or device_id like '%${filter}%'
    limit ${from}, ${limit}
`))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  const maxAllowedBirthYear = await getSetting('maxAllowedBirthYear', '2002')
  return { players, maxAllowedBirthYear }
}
export const markGameUserForEventWhenProfileGetsFilled = async (user: GameUser, jackpotId: number): Promise<void> => {
  await exec(`
    update game_user set sendWinJackpotEventWhenProfileFilled = ${jackpotId} where id = ${user.id}
  `)
}
export const unMarkGameUserForEventWhenProfileGetsFilled = async (user: GameUser): Promise<void> => {
  await exec(`
    update game_user set sendWinJackpotEventWhenProfileFilled = null where id = ${user.id}
  `)
}