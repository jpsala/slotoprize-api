import { snakeCase } from 'snakecase-keys'
import { ResultSetHeader } from 'mysql2/promise'
import camelcaseKeys from 'camelcase-keys'
// import createError from 'http-errors'
import statusCodes from 'http-status-codes'
import createError from 'http-errors'
import {queryOne, exec} from '../../../db'
import {LanguageData} from '../meta.types'
import { GameUser } from './../models/gameUser'


export async function getLanguage(userId: number): Promise<LanguageData> {
  const localizationData = await queryOne(`
    select l.* from game_user gu
      inner join language l on l.language_code = gu.language_code
    where gu.id = ${userId}
  `, undefined, true) as LanguageData
  return localizationData
}
export async function getGameUserByDeviceId(deviceId: string): Promise<GameUser>;
export async function getGameUserByDeviceId(deviceId: string, fields: string[] | undefined): Promise<Partial <GameUser> | GameUser>;
export async function getGameUserByDeviceId(deviceId: string, fields: string[] | undefined = undefined): Promise<Partial <GameUser> | GameUser> {
  const userSelect = `
      select *
        from game_user
      where device_id ='${deviceId}'`
  const user = await queryOne(userSelect, undefined, false) as GameUser
  return user
}
let cachedUser: GameUser
export async function getGameUser(userId: number): Promise<GameUser> {
  if(cachedUser && cachedUser.id === userId) return cachedUser
  const userSelect = `
    select *
    from game_user
    where id =${userId}`
  const user = camelcaseKeys(await queryOne(userSelect)) as GameUser
  cachedUser = user
  return user
}
export async function getHaveWinRaffle(userId: number): Promise<boolean> {
  const winData = await queryOne(`
    select count(*) as win from raffle_history rh
    where win = 1 and rh.game_user_id = ${userId} and notified = 0
  `)
  return winData.win > 0
}
export async function getHaveProfile(userId: number): Promise<boolean> {
  const profileData = await getGameUser(userId)
  return profileData.lastName !== "" && profileData.firstName !== ""
}
export async function delUser(deviceId: string): Promise < void > {
  const user = await getGameUserByDeviceId(deviceId)
  if(!user) return
  const {id} = user
  await exec(`
    delete from wallet where game_user_id = ${id}
  `)
  await exec(`
    delete from game_user  where id = ${id}
  `)
}
export async function addGameUser(user: GameUser): Promise<number> {
  const userToSave = Object.assign({}, user)
  const wallet = userToSave.wallet
  delete userToSave.wallet
  delete userToSave.is_new
  if(!wallet) throw createError(statusCodes.BAD_REQUEST, 'Wallet no present')
  const resp = await exec('insert into game_user set ?', userToSave)
  const userGameId = resp.insertId
  wallet.game_user_id = userGameId
  await exec('insert into wallet set ?', wallet)
  return userGameId
}