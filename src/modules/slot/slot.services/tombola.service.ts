import camelcaseKeys from 'camelcase-keys'
import { query, queryOne } from './../../../db'
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
export const getTombolaForCrud = async (): Promise<any> =>
{
  const symbols = camelcaseKeys(await getSymbols())
  const paytable = await getPayTableForCrud()
  return {paytable, symbols}
}
