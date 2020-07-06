import toCamelCase from 'camelcase-keys'
import createError from 'http-errors'
import {query as slotQuery} from '../db.slot'

export const getReelsData = async (): Promise<any> => {
  try {
    const symbolsData = await slotQuery('SELECT s.texture_url, s.payment_type FROM symbol s WHERE s.id IN (SELECT s.id FROM pay_table pt WHERE pt.symbol_id = s.id)')
    const reels: any[] = []
    for (let reel = 1; reel < 4; reel++) {
      reels.push({symbolsData: toCamelCase(symbolsData)})
      console.log('reels', reel, reels)
    }
    return reels
  } catch (error) {
    throw createError(createError.InternalServerError, error)
  }
}
export const symbolsInDB = async (): Promise<any> => {
  try {
    const SymbolsRows = await slotQuery(
      'SELECT * FROM symbol s WHERE s.id IN (SELECT s.id FROM pay_table pt WHERE pt.symbol_id = s.id)'
    )
    const reels: any[] = []
    for (let reel = 1; reel < 4; reel++)
      reels[reel] = SymbolsRows

    return {reels, symbols: SymbolsRows}
  } catch (error) {
    return {status: 'error'}
  }
}
