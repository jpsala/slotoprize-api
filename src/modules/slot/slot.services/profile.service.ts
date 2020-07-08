import createError from 'http-errors'
import * as httpStatusCodes from "http-status-codes"
import {getGameUserByDeviceId} from '../../meta/meta.repo/game-user.repo'
import {queryOneMeta, execMeta as metaExec} from '../../meta/meta.db'
import {GameUser} from "../../meta/meta.types"

export const getProfile = async (deviceId: string, fields: string[] | undefined = undefined): Promise<GameUser | Partial<GameUser>> => {
  if (!deviceId) throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter')
  const gameUser = await getGameUserByDeviceId(deviceId, fields)
  if (!gameUser) throw createError(httpStatusCodes.BAD_REQUEST, 'there is no user associated with this deviceId')
  return gameUser
}
export const setProfile = async (user: GameUser): Promise<any> => {
  if (!user.deviceId) throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter')
  const userExists = await queryOneMeta(`select * from game_user where device_id = '${user.deviceId}'`)
  if (!userExists)
    throw createError(httpStatusCodes.BAD_REQUEST, 'a user with this deviceId was not found')


  /* falta:
              countryPhoneCode: string;
              phoneNumber: string;
              isMale: boolean;
              age: number;
              address: string;
              city: string;
              zipCode: string;
              state: string;
              country: string;
*/
  await metaExec(`
          update game_user set
              email = '${user.email || ""}',
              first_name = '${user?.firstName || ""}',
              last_name = '${user.lastName || ""}',
              device_name = '${user.deviceName || ""}',
              device_model = '${user.deviceModel || ""}',
              country_phone_code = '${user.countryPhoneCode || ""}',
              phone_number = '${user.phoneNumber || ""}',
              is_male = '${user.isMale || ""}',
              age = '${user.age || ""}',
              address = '${user.address || ""}',
              city = '${user.city || ""}',
              zip_code = '${user.zipCode || ""}',
              state = '${user.state || ""}',
              country = '${user.country || ""}'
          where device_id = '${user.deviceId || ""}'
      `)
  const updatedUser = await queryOneMeta(`
          select id, first_name, last_name, email, device_id from game_user where device_id = '${user.deviceId}'
      `)
  return {firstName: updatedUser.first_name, lastName: updatedUser.last_name, email: updatedUser.email}
}