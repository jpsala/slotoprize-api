import createError from 'http-errors'
import * as httpStatusCodes from "http-status-codes"
import {PoolConnection} from 'mysql2'

export const setProfileCmd = async (conn: PoolConnection, deviceId: string, data): Promise<any> => {
  try {
    const [userRows]: any = await conn.query(`select * from game_user where device_id = ${data.deviceId}`)
    const user = userRows[0]
    if (!user) {
      throw createError(httpStatusCodes.BAD_REQUEST, 'a user with this deviceId was not found')
    }
    const [respUpdate]: any = await conn.query(`
          update game_user set
              email = '${data.email}',
              first_name = '${data.firstName}',
              last_name = '${data.lastName}',
              device_name = '${data.deviceName}',
              device_model = '${data.deviceModel}'
          where device_id = '${deviceId}'
      `)
    console.log('respUpdate', respUpdate)
    const [userUpdatedRows]: any = await conn.query(`
          select id, first_name, last_name, email, device_id from game_user where device_id = '${deviceId}'
      `)
    const updatedUser = userUpdatedRows[0]
    return updatedUser
  } finally {
    await conn.release()
  }
}
export const getProfileCmd = async (conn: any, deviceId: string): Promise<any> => {
  if (!deviceId) { throw createError(httpStatusCodes.BAD_REQUEST, 'Parameter deviceId missing') }
  try {
    const userSelect = `
        select first_name, last_name, email
          from game_user
        where device_id ='${deviceId}'`
    const [rows] = await conn.query(userSelect)
    const user = rows[0]
    if (!user) { throw createError(httpStatusCodes.BAD_REQUEST, 'there is no user associated with this deviceId') }
    return user
  } finally {
    await conn.release()
  }
}
