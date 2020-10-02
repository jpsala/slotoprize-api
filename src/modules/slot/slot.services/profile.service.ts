import camelcaseKeys from 'camelcase-keys'
import createError from 'http-errors'
import * as httpStatusCodes from "http-status-codes"
import { format } from 'date-fns'
import {getGameUserByDeviceId, toTest} from '../../meta/meta.repo/gameUser.repo'
import {queryOne, exec} from '../../../db'
import {GameUser} from "../../meta/meta.types"

export const getProfile = async (deviceId: string): Promise<GameUser | Partial<GameUser>> => {
  toTest()
  if (!deviceId) throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter')
  const gameUser = await getGameUserByDeviceId(deviceId)
  if (!gameUser) throw createError(httpStatusCodes.BAD_REQUEST, 'there is no user associated with this deviceId')
  return gameUser
}
export const setProfile = async (user: GameUser): Promise<any> => {
  if (!user.deviceId) throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter')
  const userExists = await queryOne(`select * from game_user where device_id = '${user.deviceId}'`)
  if (!userExists)
    throw createError(httpStatusCodes.BAD_REQUEST, 'a user with this deviceId was not found')
  const birthDate = user.birthDate || format(new Date(), 'yyyy-MM-dd')
  const isDev = user.isDev ? 1 : 0
  await exec(`
          update game_user set
              email = '${user.email || ""}',
              first_name = '${user?.firstName || ""}',
              last_name = '${user.lastName || ""}',
              device_name = '${user.deviceName || ""}',
              device_model = '${user.deviceModel || ""}',
              phone_number = '${user.phoneNumber || ""}',
              address = '${user.address || ""}',
              city = '${user.city || ""}',
              zip_code = '${user.zipCode || ""}',
              state = '${user.state || ""}',
              title = '${user.title || ""}',
              birth_date = "${String(birthDate)}",
              isDev = '${isDev}',
              country = '${user.country || ""}',
              advertisingId = '${user.advertisingId || ""}'
          where device_id = '${user.deviceId}'
      `)
      // select id, first_name, last_name, email, device_id from game_user where device_id = '${user.deviceId}'
  const updatedUser = await queryOne(`
          select * from game_user where device_id = '${user.deviceId}'
      `)
  console.log('updtedUser', updatedUser)
  delete updatedUser.createdAt
  delete updatedUser.updatedAt
  delete updatedUser.password
  return camelcaseKeys(updatedUser) as GameUser
}
