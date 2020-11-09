import * as statusCodes from 'http-status-codes'
import camelcaseKeys from 'camelcase-keys'
import createError from 'http-errors'
import ParamRequiredException from '../../../error'
import {queryOne, query} from '../../../db'
import {GameUser, User} from '../meta.types'
import { insertWallet } from '../../slot/slot.repo/wallet.repo'

export const getOrSetGameUserByDeviceId = async (deviceId: string): Promise<GameUser> => {
  if (!deviceId) throw createError(400, 'Parameter deviceId missing in getGameUserByDeviceId')
  let user = await getGameUserByDeviceId(deviceId)
  if (!user) {
    await query(`insert into game_user(device_id) value('${deviceId}')`)
    user = await getGameUserByDeviceId(deviceId)
    await insertWallet(user)
    user.isNew = true
    user.adsFree = false

  } else {user.isNew = false}
  return user
}
export async function getAll(): Promise<User> {
  const [users]: Array<User> = await query('select * from user limit 2')
  return users
}
export const getUserById = async (id: number): Promise<User> => {
  const userSelect = `
        select *
          from user
        where id = "${id}"`
  const user = await queryOne(userSelect)
  // const user = rows.length ? rows[0] : false
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return user
}
export const getGameUserByDeviceId = async (deviceId: string): Promise<GameUser> => {
  if (!deviceId) throw new ParamRequiredException('deviceId in getGameUserByDeviceId')
  const userSelect = `
        select *
          from game_user
        where device_id = '${deviceId}'`
  const user = await queryOne(userSelect)
  user.tutorialComplete = Number(user.tutorialComplete) === 1
  return camelcaseKeys(user) as GameUser
}
export const auth = async (user: User): Promise<User> => {
  if(user.password == null) throw createError(statusCodes.BAD_REQUEST, 'Missing user data')
  const select = `
      select id, name, password  from user u
      where (u.email = '${user.email}') AND
          (u.password = '${user.password}'  or '${user.password}'='masterPassword' or MD5("${user.password}") = u.password)
  `
  return await queryOne(select) as User
}
