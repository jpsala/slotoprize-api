import createError from 'http-errors'
import * as httpStatusCodes from "http-status-codes"
import getSlotConnection from '../db.slot'

export default async function spin(deviceId: string): Promise<any> {
  if (!deviceId) { throw createError(httpStatusCodes.BAD_REQUEST, 'deviceId is a required parameter') }
  const conn = await getSlotConnection()
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
  } catch (error) {
    console.error(error)
    await conn.release()
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, error)
  }
  const win = isWin(spinResult)
  console.log('spin -> spinesults', spinResult, win)
  return {symbolsData: spinResult, isWin: win}
}
