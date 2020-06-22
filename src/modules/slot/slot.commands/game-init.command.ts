
import createError from 'http-errors'
import * as httpStatusCodes from "http-status-codes"

export const gameInitCmd = async (conn: any): Promise<any> => {
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
