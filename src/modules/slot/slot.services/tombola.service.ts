import { BAD_REQUEST } from 'http-status-codes'
import camelcaseKeys from 'camelcase-keys'
import createHttpError from 'http-errors'
import { getSetting, setSetting } from './settings.service'
import getConnection, { query, queryOne } from './../../../db'
import { getSymbols } from './symbol.service'

export const getPayTableForCrud = async (): Promise<any> => {
  const payTable = await query(`
  select * from pay_table
    order by probability asc`)
  for (const row of payTable)
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    row.symbol = camelcaseKeys(await queryOne(`select * from symbol where id = ${row.symbol_id}`))

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return camelcaseKeys(payTable)
}
export const postWinLoseForTombolaCrudPost = async (lose: number): Promise<any> =>
{
  if(!lose || lose < 1 || lose > 100) throw createHttpError(BAD_REQUEST, `Lose has an invalid value ${lose}`)
  await setSetting('spinLosePercent', lose)
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const postTombolaForCrud = async (body: any): Promise<any> =>
{
  const conn = await getConnection()
  await conn.beginTransaction()
  try {
    await conn.query(`delete from pay_table`)
    for (const row of body) {
      if(row.new) delete row.id
      await conn.query(`insert into pay_table set ?`,
        [{
          "id": row.id,
          "symbol_id": row.symbolId,
          "symbol_amount": row.symbolAmount,
          "probability": row.probability,
          "points": row.points
      }])
    }
    await conn.commit()
  }catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.destroy()
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {status: 'ok'}
}
export const getTombolaForCrud = async (): Promise<any> =>
{
  const symbols = camelcaseKeys(await getSymbols())
  const paytable = await getPayTableForCrud()
  const spinLosePercent = Number(await getSetting('spinLosePercent', '20'))
  return {paytable, symbols, spinLosePercent}
}
