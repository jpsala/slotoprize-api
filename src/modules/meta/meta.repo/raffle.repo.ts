import camelcaseKeys from 'camelcase-keys'
// import createError from 'http-errors'
import {query} from '../meta.db'
import {RafflePrizeData, RafflePrizeLocalizationData} from '../meta.types'

export async function getRaffles(fieldsToExclude: string[] | undefined = undefined, camelCased = false): Promise<RafflePrizeData[]> {
  const raffles = await query(`
    SELECT r.id, DATE_FORMAT(r.closing_date, '%Y/%m/%d') closing_date,
      r.raffle_number_price, r.texture_url, r.item_highlight
    FROM raffle r
  `) as RafflePrizeData[]
  console.log('raffles', raffles)
  for (const raffle of raffles) {
    console.log('raffle', raffle.id)
    const resp = await query(`
      select language_code, name, description from raffle_localization rl where rl.raffle_id = ${raffle.id}
    `) as RafflePrizeLocalizationData[]
    const rafflePrizesLocalizationData = camelCased ? camelcaseKeys(resp) : resp
    // eslint-disable-next-line require-atomic-updates
    raffle.rafflePrizesLocalizationData = rafflePrizesLocalizationData
    if (fieldsToExclude) {
      fieldsToExclude.forEach((fieldToExclude) => delete raffle[fieldToExclude])
    }
  }
  return camelCased ? camelcaseKeys(raffles) : raffles as RafflePrizeData[]
}

