import camelcaseKeys from 'camelcase-keys'
import createError from 'http-errors'
import * as httpStatusCodes from "http-status-codes"
import snakecaseKeys from 'snakecase-keys'
import {getGameUserByDeviceId, toTest} from '../../meta/meta.repo/gameUser.repo'
import {queryOne, queryExec} from '../../../db'
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

  const userExists = await queryOne(`select * from game_user where device_id = '${user.deviceId}'`)
  if (!userExists)
    throw createError(httpStatusCodes.BAD_REQUEST, 'a user with this deviceId was not found')

  const userForSave = <any> snakecaseKeys(user)
  
  if (user.birthDate) {
    const birthDateParts = String(user.birthDate).split('T')
    const birthDate = birthDateParts[0]
    userForSave.birth_date = birthDate
  }

  if (userForSave.ads_free !== undefined) userForSave.adsFree = toBoolean(userForSave.ads_free)
  if (userForSave.agreements !== undefined) userForSave.agreements = (userForSave.agreements === 'true' ? 1 : 0)
  if(userForSave.tutorial_complete !== undefined) userForSave.tutorial_complete = toBoolean(userForSave.tutorial_complete)

  delete userForSave.is_dev
  delete userForSave.ads_free
  delete userForSave.isDev
  delete userForSave.banned
  delete userForSave.session_token

  await queryExec(`update game_user set ? where device_id = '${user.deviceId}'`, userForSave)

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
  user.agreements = toBoolean(user.agreements)
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