import createError from 'http-errors'
import * as httpStatusCodes from 'http-status-codes'
import snakeCaseKeys from 'snakecase-keys'
import camelcaseKeys from 'camelcase-keys'
import { classToPlain } from "class-transformer"
import { RowDataPacket } from 'mysql2'
import * as metaService from '../../meta/meta-services/meta.service'
import getConnection, {queryOne, exec, query } from '../../../db'
import { LanguageData, GameUser, fakeUser } from '../meta.types'
import { getWallet, updateWallet, insertWallet } from '../../slot/slot.services/wallet.service'
import { Wallet } from './../models/wallet'
import { getSetting } from './../../slot/slot.services/settings.service'



export const purchaseTickets = async (deviceId: string,ticketAmount: number): Promise<Wallet> => {
  if (!deviceId) throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter')

  const user = await metaService.getGameUserByDeviceId(deviceId)
  const wallet = await getWallet(user)
  const ticketValue = Number(await getSetting('ticketPrice', 1))
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
  user.wallet = await getWallet(user)
  return user
}
export async function setGameUserSpinData(userId: number): Promise<void>
{
  const spinCountResp = await queryOne(`select id, spinCount from game_user_spin where game_user_id = ${userId}`)
  await exec(`
    replace into game_user_spin set ?
  `, {
      "id": spinCountResp?.id,
      "game_user_id": userId,
      "spinCount": spinCountResp?.spinCount >= 0 ? (Number(spinCountResp.spinCount )+1) : 0
  })
}
export async function getLoginData(userId: number): Promise<{count: number, lastLogin: Date}> {
  const response = await queryOne(`
    select
      (select count(*) from game_user_login u where u.game_user_id = ${userId}) as count,
      (select max(u.date) from game_user_login u where u.game_user_id = ${userId}) as lastLogin`)
  return response as {count: number, lastLogin: Date}
}
export async function getWinRaffle(userId: number): Promise<any> {
  const winData = await queryOne(`
  select r.id, r.closing_date,
  r.raffle_number_price, r.texture_url, r.item_highlight
  from raffle_history rh
  inner join raffle r on rh.raffle_id = r.id
  where win = 1 and rh.game_user_id = ${userId} and notified = 0
  order by rh.id desc limit 1
  `)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return winData
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
    where state = 'new' and jw.game_user_id = ${userId} and jw.notified = 0
  `)
  return winData.win > 0
}
export async function getHaveProfile(userId: number): Promise<boolean> {
  const profileData = await getGameUser(userId)
  console.log('profileData', profileData)
  return profileData.lastName !== "" &&
         profileData.firstName !== "" &&
         profileData.address !== "" &&
         profileData.age !== 0 &&
         profileData.city !== "" &&
         profileData.country !== "" &&
         profileData.phoneCode !== "" &&
         profileData.email !== "" &&
         profileData.phoneNumber !== "" &&
         profileData.state !== "" &&
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
  const fakedUser = fakeUser(override)
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
  return players
}
