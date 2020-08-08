import snakeCaseKeys from 'snakecase-keys'
import camelcaseKeys from 'camelcase-keys'
import { classToPlain } from "class-transformer"
import { RowDataPacket } from 'mysql2'
import getConnection, {queryOne, exec, query } from '../../../db'
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
export async function setGameUserSpinData(userId: number): Promise<void>
{
  const spinCountResp = await queryOne(`select id, spinCount from game_user_spin where game_user_id = ${userId}`)
  console.log('sc', spinCountResp)
  const response = await exec(`
    replace into game_user_spin set ?
  `, {
      "id": spinCountResp?.id,
      "game_user_id": userId,
      "spinCount": spinCountResp?.spinCount >= 0 ? (Number(spinCountResp.spinCount )+1) : 0
  })
  console.log('response', response)
}
export async function getLoginData(userId: number): Promise<{count: number, lastLogin: Date}> {
  const response = await queryOne(`
    select
      (select count(*) from game_user_login u where u.game_user_id = ${userId}) as count,
      (select max(u.date) from game_user_login u where u.game_user_id = ${userId}) as lastLogin`)
  return response as {count: number, lastLogin: Date}
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
    await conn.commit()
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
export async function setGameUserLogin(deviceId: string): Promise<any>
{
  const gameUser = await getGameUserByDeviceId(deviceId)
  const resp = await exec(`
    replace into game_user_login set ?
  `,
    {
      "game_user_id": gameUser.id,
      "game_id": 1,
      "device_id": deviceId
    }
  )
  console.log('resp', resp)
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
