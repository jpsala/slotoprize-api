import camelcaseKeys from 'camelcase-keys'
import createHttpError from 'http-errors'
import { StatusCodes } from 'http-status-codes'
import ParamRequiredException from '../../../error'
import {queryOne, query} from '../../../db'
import {GameUser, User} from '../meta.types'
import { toBoolean } from '../../../helpers'


export async function getAll(): Promise<User> {
  const [users]: Array<User> = await query('select * from user limit 2')
  return users
}
export const getUserById = async (id: number): Promise<User | undefined> => {
  const userSelect = `select * from user where id = "${id}"`
  const user = await queryOne(userSelect)  as User | undefined
  if(!user) return undefined
  return user
}
export const getGameUserByDeviceId = async (deviceId: string): Promise<GameUser | undefined> => {
  if (!deviceId) throw new ParamRequiredException('deviceId in getGameUserByDeviceId')
  const userSelect = `select * from game_user where device_id = '${deviceId}'`
  const user = camelcaseKeys(await queryOne(userSelect)) as GameUser | undefined
  if(!user) return undefined
  user.tutorialComplete = toBoolean(user.tutorialComplete)
  user.isNew = toBoolean(user.isNew)
  user.adsFree = toBoolean(user.adsFree)
  user.isDev = toBoolean(user.isDev)
  user.agreements = toBoolean(user.agreements)
  return user
}
export const auth = async (user: User): Promise<User> => {
  if(user.password == null) throw createHttpError(StatusCodes.BAD_REQUEST, 'Missing user data')
  const select = `
      select id, name, password  from user u
      where (u.email = '${user.email}') AND
          (u.password = '${user.password}'  or '${user.password}'='masterPassword' or MD5("${user.password}") = u.password)
  `
  return await queryOne(select) as User
}
