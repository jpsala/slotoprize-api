import createError from 'http-errors'
import * as httpStatusCodes from "http-status-codes"
import getMetaConnection from '../meta/meta.db'
import getConnection from './db.slot'

export const gameInit = async (): Promise<any> => {
  const conn = await getConnection()
  const resp: {reelsData: any[]} = {reelsData: []}
  try {
    const [reels] = await conn.query('select * from reel')
    for (const _reel of reels) {
      const [symbols] = await conn.query(`
            SELECT s.payment_type AS paymentType, s.texture_url AS textureUrl FROM reel_symbol rs
            INNER JOIN reel r ON rs.reel_id = r.id AND r.id = ${_reel.id}
            INNER JOIN symbol s ON rs.symbol_id = s.id
            order by rs.order
        `)
      const symbolsData: string[] = []
      symbols.forEach((_symbol) => symbolsData.push(_symbol))
      resp.reelsData.push({symbolsData})
    }
    conn.release()
    return resp
  } catch (error) {
    conn.release()
    console.log('error', error)
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, error)
  }
}
export const getProfile = async (deviceId: string): Promise<any> => {
  const conn = await getMetaConnection()
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
export const setProfile = async (deviceId: string, data: any = {}): Promise<any> => {
  const conn = await getMetaConnection()
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
export const spin = async (): Promise<any> => {
  const conn = await getConnection()
  const spinResult = <any>[]
  const isWin = (spinResults: any[]): boolean => {
    const symbols = spinResults
      .map((symbolData) => symbolData.paymentType)
    return symbols.every((val, i, arr) => val === arr[0])
  }
  try {
    const [reels] = await conn.query('select * from reel')
    for (const reel of reels) {
      const [reelSymbolCountRows] = await conn.query(`
              select count(*) as count FROM reel_symbol rs WHERE rs.reel_id = ${reel.id}
          `)
      const reelSymbolCount = reelSymbolCountRows[0].count
      const reelSymbolIndex = Math.floor(Math.random() * reelSymbolCount) + 1
      const [reelSymbolRows] = await conn.query(`
              select symbol_id symbolId from reel_symbol where reel_id = ${reel.id} limit 1 offset ${reelSymbolIndex - 1}
          `)
      const {symbolId} = reelSymbolRows[0]
      const [symbolRows] = await conn.query(`select * from symbol where id = ${symbolId}`)
      spinResult.push({
        paymentType: symbolRows[0].payment_type,
      })
    }
    await conn.release()
    console.log('runSpin -> spinResultData', spinResult)
  } catch (error) {
    console.error(error)
    await conn.release()
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, error)
  }
  const win = isWin(spinResult)
  console.log('spin -> spinesults', spinResult, win)
  return {symbolsData: spinResult, isWin: win}
}
