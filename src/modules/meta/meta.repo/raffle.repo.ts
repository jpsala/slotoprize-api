import camelcaseKeys from 'camelcase-keys'
import createError from 'http-errors'
import {query, queryOne, exec} from '../meta.db'
import {RafflePrizesData, LocalizationData, GameUser} from '../meta.types'


export async function getRaffles(fieldsToExclude: string[] | undefined = undefined, camelCased = true): Promise<RafflePrizesData[]> {
  const raffles = await query(`
    SELECT r.id, DATE_FORMAT(r.closing_date, '%Y/%m/%d') closing_date,
      r.raffle_number_price, r.texture_url, r.item_highlight
    FROM raffle r
  `) as RafflePrizesData[]
  console.log('raffles', raffles)
  for (const raffle of raffles) {
    console.log('raffle', raffle.id)
    const resp = await query(`
      select language_code, name, description from raffle_localization rl where rl.raffle_id = ${raffle.id}
    `) as LocalizationData[]
    const localizationData = camelCased ? camelcaseKeys(resp) : resp
    // eslint-disable-next-line require-atomic-updates
    raffle.localizationData = localizationData
    if (fieldsToExclude)
      fieldsToExclude.forEach((fieldToExclude) => delete raffle[fieldToExclude])
  }
  return camelCased ? camelcaseKeys(raffles) : raffles as RafflePrizesData[]
}

export async function getRaffle(id: number,
  fieldsToExclude: string[] | undefined = undefined, camelCased = true): Promise<RafflePrizesData> {
  const raffle = await queryOne(`
    SELECT r.id, DATE_FORMAT(r.closing_date, '%Y/%m/%d') closing_date,
      r.raffle_number_price, r.texture_url, r.item_highlight
    FROM raffle r where r.id = ${id}
  `) as RafflePrizesData
  if (fieldsToExclude)
    fieldsToExclude.forEach((fieldToExclude) => delete raffle[fieldToExclude])
  return camelCased ? camelcaseKeys(raffle) : raffle as RafflePrizesData
}
type SaveRaffleNewId = number
export async function saveRaffle(raffle: RafflePrizesData, user: GameUser, ticketsUsed: number, amount: number): Promise<SaveRaffleNewId> {
  // @TODO validate parameters
  try {
    const resp = await exec(`
      insert into raffle_history(raffle_id, game_user_id, ticketsUsed, raffle_number) VALUES (?,?,?,?)
    `, [raffle.id, user.id, ticketsUsed, amount])
    return resp.insertId as SaveRaffleNewId
  } catch (error) {
    throw createError(createError.InternalServerError, error)
  }
}
