import { BAD_REQUEST } from 'http-status-codes'
import camelcaseKeys from 'camelcase-keys'
import createHttpError from 'http-errors'
import { getJackpotLiveRow } from '../slot.repo/jackpot.repo'
import { getAtlas } from '../../meta/meta-services/atlas'
import { getGameUserSpinData } from '../../meta/meta.repo/gameUser.repo'
import { GameUser } from '../../meta/meta.types'
import { getAssetsUrl } from './../../../helpers'
import { getSetting, setSetting } from './settings.service'
import getConnection, { query, queryOne } from './../../../db'
import { deleteSymbolsAtlas, getReelsData, getSymbols, SymbolDTO } from './symbol.service'
import { getPayTable } from './spin.service'

type PayTableDTO = {id: number, symbol_id: number, symbol_amount: number, probability: number, points: number, symbol: SymbolDTO}
export const getPayTableForCrud = async (): Promise<any> => {
  const url = getAssetsUrl()
  const payTable: PayTableDTO[] = await query(`
  select * from pay_table
    order by probability asc`)
  for (const row of payTable) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    row.symbol = camelcaseKeys(await queryOne(`
      select id, concat('${url}', texture_url) as texture_url, payment_type, symbol_name from symbol where id = ${row.symbol_id}
    `))
    if ((row.symbol as any).paymentType === 'jackpot') {
      const liveRow = await getJackpotLiveRow()
      const idxSymbol = payTable.findIndex(_symbol => Number(_symbol.id) === Number(row.id))
      if (idxSymbol >= 0) payTable[idxSymbol].points = Number(liveRow?.prize)
      console.log('jackpot for tombola', payTable[idxSymbol])
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return camelcaseKeys(payTable)
}
export const postWinLoseForTombolaCrudPost = async (lose: number): Promise<any> =>
{
  if(!lose || lose < 1 || lose > 100) throw createHttpError(BAD_REQUEST, `Lose has an invalid value ${lose}`)
  await setSetting('spinLosePercent', String(lose))
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
    await deleteSymbolsAtlas()
  }catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.destroy()
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {status: 'ok'}
}
export const getSlotData = async (user: GameUser): Promise<any> => {
  const maxMultiplier = Number(await getSetting('maxMultiplier', '3'))
  const spinCount = Number(await getGameUserSpinData(user.id))
  const atlasData = await getAtlas(<string> 'symbols')
  const reelsData = await getReelsData()
  const payTable = await getPayTable()
    reelsData.forEach((reel) => {
      reel.symbolsData.forEach((reelSymbol) => {
        const symbolPays: any[] = []
        payTable.filter((payTableSymbol) => payTableSymbol.symbol_name === reelSymbol.symbolName)
          .forEach((_symbol) => symbolPays.push(_symbol))
        const symbolAllPays: any[] = []
        for (let index = 1; index < 4; index++) {
          const row = symbolPays.find((_symbol) => _symbol.symbol_amount === index)
          if (row) symbolAllPays.push(row.points)
          else symbolAllPays.push(0)
        }
        reelSymbol.pays = symbolAllPays
      })
    })
    return {maxMultiplier, reelsData, atlasData, spinCount}
}
export const getTombolaForCrud = async (): Promise<any> =>
{
  const symbols = camelcaseKeys(await getSymbols())
  const paytable = await getPayTableForCrud()
  const spinLosePercent = Number(await getSetting('spinLosePercent', '20'))
  return {paytable, symbols, spinLosePercent }
}
