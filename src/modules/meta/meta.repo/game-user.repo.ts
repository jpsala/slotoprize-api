import camelcaseKeys from 'camelcase-keys'
// import createError from 'http-errors'
import {queryOneMeta} from '../meta.db'
import {LanguageData, GameUser} from '../meta.types'

export async function getLanguage(userId: number): Promise<LanguageData> {
  const localizationData = await queryOneMeta(`
    select l.* from game_user gu
      inner join language l on l.language_code = gu.language_code
    where gu.id = ${userId}
  `, undefined, true)
  return localizationData
}
export async function getGameUserByDeviceId(deviceId: string): Promise<GameUser>;
export async function getGameUserByDeviceId(deviceId: string, fields: string[] | undefined): Promise<Partial <GameUser> | GameUser>;
export async function getGameUserByDeviceId(deviceId: string, fields: string[] | undefined = undefined): Promise<Partial <GameUser> | GameUser> {
  const userSelect = `
      select *
        from game_user
      where device_id ='${deviceId}'`
  const user = await queryOneMeta(userSelect, undefined, false, fields) as GameUser
  return user
}
let cachedUser: GameUser
export async function getGameUser(userId: number): Promise<GameUser> {
  if(cachedUser && cachedUser.id === userId) return cachedUser
  const userSelect = `
    select *
    from game_user
    where id =${userId}`
  const user = camelcaseKeys(await queryOneMeta(userSelect)) as GameUser
  cachedUser = user
  return user
}
export async function getHaveWinRaffle(userId: number): Promise<boolean> {
  const winData = await queryOneMeta(`
    select count(*) as win from raffle_history rh
    where win = 1 and rh.game_user_id = ${userId} and notified = 0
  `)
  return winData.win > 0
}
export async function getHaveProfile(userId: number): Promise<boolean> {
  const profileData = await getGameUser(userId)
  console.log('pd', profileData)
  return profileData.lastName !== "" && profileData.firstName !== ""
}
