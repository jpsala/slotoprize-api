// import createError from 'http-errors'
import {queryOne} from '../meta.db'
import {LanguageData, GameUser} from '../meta.types'

export async function getLanguage(userId: number): Promise<LanguageData> {
  const localizationData = await queryOne(`
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
  const user = await queryOne(userSelect, undefined, false, fields) as GameUser
  return user
}
export async function getGameUser(userId: number): Promise<GameUser> {
  const userSelect = `
    select *
    from game_user
    where id =${userId}`
  const [rows] = await queryOne(userSelect) as GameUser[]
  const user = rows[0] as GameUser
  return user
}
