import createError from 'http-errors'
import * as httpStatusCodes from "http-status-codes"
import getMetaConnection from '../meta/meta.db'
import {GameUser} from "../meta/meta.types"
import {getGameUserByDeviceId} from '../meta/meta.repo/user.repo'
import * as spinService from "./slot.services/spin.service"
import {query} from './db.slot'

export const getReelsData = async (): Promise<any> => {
  try {
    const symbolsData = await query('SELECT s.texture_url, s.payment_type FROM symbol s WHERE s.id IN (SELECT s.id FROM pay_table pt WHERE pt.symbol_id = s.id)')
    const reels: any[] = []
    for (let reel = 1; reel < 4; reel++) {
      reels.push({symbolsData})
      console.log('reels', reel, reels)
    }
    return reels
  } catch (error) {
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, error)
  }
}
export const getProfile = async (deviceId: string, fields: string[] | undefined = undefined): Promise<GameUser | Partial<GameUser>> => {
  if (!deviceId) { throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter') }
  const gameUser = await getGameUserByDeviceId(deviceId, fields)
  if (!gameUser) { throw createError(httpStatusCodes.BAD_REQUEST, 'there is no user associated with this deviceId') }
  return gameUser
}
export const setProfile = async (user: GameUser): Promise<any> => {
  if (!user.deviceId) { throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter') }
  const conn = await getMetaConnection()
  try {
    const [userRows]: any = await conn.query(`select * from game_user where device_id = '${user.deviceId}'`)
    const userExists = userRows[0]
    if (!userExists) {
      throw createError(httpStatusCodes.BAD_REQUEST, 'a user with this deviceId was not found')
    }
    await conn.query(`
          update game_user set
              email = '${user.email}',
              first_name = '${user.firstName}',
              last_name = '${user.lastName}',
              device_name = '${user.deviceName}',
              device_model = '${user.deviceModel}'
          where device_id = '${user.deviceId}'
      `)
    const [userUpdatedRows]: any = await conn.query(`
          select id, first_name, last_name, email, device_id from game_user where device_id = '${user.deviceId}'
      `)
    const updatedUser = userUpdatedRows[0]
    return {firstName: updatedUser.first_name, lastName: updatedUser.last_name, email: updatedUser.email}
  } finally {
    await conn.release()
  }
}
// eslint-disable-next-line require-await
export const spin = async (deviceId: string, multiplier: string): Promise<any> => {
  return spinService.spin(deviceId, Number(multiplier))
}
export const symbolsInDB = async (): Promise<any> => {
  try {
    const SymbolsRows = await query(
      'SELECT * FROM symbol s WHERE s.id IN (SELECT s.id FROM pay_table pt WHERE pt.symbol_id = s.id)'
    )
    const reels: any[] = []
    for (let reel = 1; reel < 4; reel++) {
      reels[reel] = SymbolsRows
    }
    return {reels, symbols: SymbolsRows}
  } catch (error) {
    return {status: 'error'}
  }
}
