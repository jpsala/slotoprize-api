import camelcaseKeys from 'camelcase-keys'
import createError from 'http-errors'
import * as httpStatusCodes from "http-status-codes"
import { format } from 'date-fns'
import snakecaseKeys from 'snakecase-keys'
import {getGameUserByDeviceId, toTest} from '../../meta/meta.repo/gameUser.repo'
import {queryOne, exec} from '../../../db'
import {GameUser} from "../../meta/meta.types"
import { sendJackpotWinEvent } from './jackpot.service'

export const getProfile = async (deviceId: string): Promise<GameUser | Partial<GameUser>> => {
  toTest()
  if (!deviceId) throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter')
  const gameUser = await getGameUserByDeviceId(deviceId)
  if (!gameUser) throw createError(httpStatusCodes.BAD_REQUEST, 'there is no user associated with this deviceId')
  return gameUser
}
export const setProfile = async (user: GameUser): Promise<any> => { 
  console.log('setProfile for user %O', user)
  if (!user.deviceId) throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter')

  const userExists = await queryOne(`select * from game_user where device_id = '${user.deviceId}'`)
  if (!userExists)
    throw createError(httpStatusCodes.BAD_REQUEST, 'a user with this deviceId was not found')

  // let birthDateParts = (String(user.birthDate) || format(new Date(1900, 0, 1), 'yyyy-MM-dd')).split('T')
  let birthDateParts
  if (user.birthDate)
    birthDateParts = String(user.birthDate).split('T')
  else
    birthDateParts = format(new Date(1900, 0, 1), 'yyyy-MM-dd').split('T')
    
  const birthDate = birthDateParts[0]

  const userForSave = <any> snakecaseKeys(user)

  userForSave.birth_date = birthDate

  if(userForSave.is_dev !== undefined) userForSave.isDev = (userForSave.is_dev === 'true' ? 1 : 0)

  delete userForSave.is_dev
  delete userForSave.session_token
  console.log('userForSave', userForSave)
  await exec(`
          update game_user set ?
              
          where device_id = '${user.deviceId}'
      `, userForSave)
  // await exec(`
  //         update game_user set
  //             email = '${user.email || ""}',
  //             first_name = '${user?.firstName || ""}',
  //             last_name = '${user.lastName || ""}',
  //             device_name = '${user.deviceName || ""}',
  //             device_model = '${user.deviceModel || ""}',
  //             phone_number = '${user.phoneNumber || ""}',
  //             address = '${user.address || ""}',
  //             city = '${user.city || ""}',
  //             zip_code = '${user.zipCode || ""}',
  //             state = '${user.state || ""}',
  //             title = '${user.title || ""}',
  //             adsFree = '${user.adsFree ? 1 : 0}',
  //             birth_date = "${String(birthDate)}",
  //             isDev = '${isDev}',
  //             country = '${user.country || ""}',
  //             devicePlataform = '${user.devicePlataform || ""}'
              
  //         where device_id = '${user.deviceId}'
  //     `)
      // select id, first_name, last_name, email, device_id from game_user where device_id = '${user.deviceId}'
  const updatedUser = await queryOne(`
          select * from game_user where device_id = '${user.deviceId}'
      `)
  delete updatedUser.createdAt
  delete updatedUser.updatedAt
  delete updatedUser.password
  delete updatedUser.sendWinJackpotEventWhenProfileFilled
  await sendWinJackpotEventIfCorrespond(updatedUser)
  return camelcaseKeys(updatedUser) as GameUser
}

const sendWinJackpotEventIfCorrespond = async (user: GameUser): Promise<void> => {
  const respPendingEvent = await queryOne(`
    select sendWinJackpotEventWhenProfileFilled from game_user where id = '${user.id}'
  `)
  if (respPendingEvent?.sendWinJackpotEventWhenProfileFilled)
    await sendJackpotWinEvent(user, respPendingEvent.sendWinJackpotEventWhenProfileFilled)
}