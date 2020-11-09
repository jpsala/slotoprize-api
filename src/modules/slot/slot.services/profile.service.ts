import camelcaseKeys from 'camelcase-keys'
import createError from 'http-errors'
import * as httpStatusCodes from "http-status-codes"
import { format } from 'date-fns'
import snakecaseKeys from 'snakecase-keys'
import {getGameUserByDeviceId, toTest} from '../../meta/meta.repo/gameUser.repo'
import {queryOne, exec} from '../../../db'
import {GameUser} from "../../meta/meta.types"
import { toBoolean } from '../../../helpers'
import { sendJackpotWinEvent } from './jackpot.service'
import { wsServer } from './webSocket/ws.service'

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

  if (userForSave.is_dev !== undefined) userForSave.isDev = toBoolean(userForSave.is_dev)
  if(userForSave.tutorial_complete !== undefined) userForSave.tutorial_complete = toBoolean(userForSave.tutorial_complete)

  delete userForSave.is_dev
  delete userForSave.session_token

  await exec(`update game_user set ? where device_id = '${user.deviceId}'`, userForSave)

  const updatedUser = gameUserToProfile(await getGameUserByDeviceId(user.deviceId)) as any
  await sendWinJackpotEventIfCorrespond(updatedUser)
  wsServer.updateUser(updatedUser)
  return updatedUser as GameUser
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const gameUserToProfile = (rawUser: any): GameUser => {
  const user = camelcaseKeys(rawUser)
  delete user.createdAt
  delete user.updatedAt
  delete user.modifiedAt
  delete user.password
  delete user.sendWinJackpotEventWhenProfileFilled
  user.banned = toBoolean(user.banned)
  user.isDev = toBoolean(user.isDev)
  user.adsFree = toBoolean(user.adsFree)
  user.tutorialComplete = toBoolean(user.tutorialComplete)
  return user as GameUser
}
const sendWinJackpotEventIfCorrespond = async (user: GameUser): Promise<void> => {
  const respPendingEvent = await queryOne(`
    select sendWinJackpotEventWhenProfileFilled from game_user where id = '${user.id}'
  `)
  if (respPendingEvent?.sendWinJackpotEventWhenProfileFilled)
    await sendJackpotWinEvent(user, respPendingEvent.sendWinJackpotEventWhenProfileFilled)
}