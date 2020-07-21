import snakeCaseKeys from 'snakecase-keys'
import camelcaseKeys from 'camelcase-keys'
// import createError from 'http-errors'
import statusCodes from 'http-status-codes'
import createError from 'http-errors'
import { classToPlain } from "class-transformer"
import { RowDataPacket } from 'mysql2'
import getConnection, {queryOne, exec} from '../../../db'
import {LanguageData, GameUser, fakeUser } from '../meta.types'




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
// let cachedUser: GameUser
export async function getGameUser(userId: number): Promise<GameUser> {
  // if(cachedUser && cachedUser.id === userId) return cachedUser
  const userSelect = `
    select *
    from game_user
    where id =${userId}`
  const user = camelcaseKeys(await queryOne(userSelect)) as GameUser
  const wallet = await queryOne(
    `select coins, tickets from wallet where game_user_id = ${userId}`
  )
  user.wallet = wallet
  // cachedUser = user
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
type WalletDTO = {coins: number, tickets: number, game_user_id: number}

// @TODO ver de user class-transmormer abajo
export async function addGameUser(user: GameUser): Promise<GameUser> {
  delete user.isNew
  if(user.id === -1) delete user.id
  const snakeCasedUser = snakeCaseKeys(user)
  const wallet = snakeCasedUser.wallet
  delete snakeCasedUser.wallet
  const conn = await getConnection()
  let userGameId: number
  await conn.beginTransaction()
  try {
      const [result] = await conn.query('insert into game_user set ?', snakeCasedUser) as RowDataPacket[]
      userGameId = result.insertId
      user.id = userGameId
      let walletDTO: WalletDTO
      if (user.wallet) {
        walletDTO = <WalletDTO>classToPlain(wallet)
        walletDTO.game_user_id = userGameId
        await conn.query('insert into wallet set ?', walletDTO)
      }
    } finally {
      await conn.rollback()
      conn.destroy()
    }
    return user
  }
export async function getNewSavedFakeUser(override: Partial<GameUser> = {}): Promise<GameUser>{
  const fakedUser = fakeUser(override)
  const newUser = await addGameUser(fakedUser)
  return newUser
}