import camelcaseKeys from 'camelcase-keys'
import createError from 'http-errors'
import {query, queryOne, exec} from '../meta.db'
import {RafflePrizeData, LocalizationData, GameUser, RaffleRecordData} from '../meta.types'
import {getGameUserByDeviceId} from "../meta.service"


export async function getRaffles(fieldsToExclude: string[] | undefined = undefined, camelCased = true): Promise<RafflePrizeData[]> {
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
    `) as LocalizationData[]
    const localizationData = camelCased ? camelcaseKeys(resp) : resp
    // eslint-disable-next-line require-atomic-updates
    raffle.localizationData = localizationData
    if (fieldsToExclude)
      fieldsToExclude.forEach((fieldToExclude) => delete raffle[fieldToExclude])
  }
  return camelCased ? camelcaseKeys(raffles) : raffles as RafflePrizeData[]
}
export async function getRaffle(id: number,
  fieldsToExclude: string[] | undefined = undefined, camelCased = true): Promise<RafflePrizeData> {
  const raffle = await queryOne(`
    SELECT r.id, DATE_FORMAT(r.closing_date, '%Y/%m/%d') closing_date,
      r.raffle_number_price, r.texture_url, r.item_highlight
    FROM raffle r where r.id = ${id}
  `) as RafflePrizeData
  if (fieldsToExclude)
    fieldsToExclude.forEach((fieldToExclude) => delete raffle[fieldToExclude])
  return camelCased ? camelcaseKeys(raffle) : raffle as RafflePrizeData
}
export async function getRafflePurchaseHistory(deviceId: string): Promise<RaffleRecordData[]> {
  if (!deviceId) throw createError(createError.BadRequest, 'deviceId is a required parameter')
  const gameUser = await getGameUserByDeviceId(deviceId)
  const raffleHistory = await query(`
  SELECT rh.raffle_id as raffle_item_id, DATE_FORMAT(rh.transaction_date, '%Y/%m/%d') AS transaction_date, rh.tickets,
  DATE_FORMAT(rh.closing_date, '%Y/%m/%d') AS closing_date, rh.raffle_id, rh.raffle_numbers
  FROM raffle_history rh where rh.game_user_id = ${gameUser.id}
  order by id desc
  limit 20
  `)
  return camelcaseKeys(raffleHistory)
}
type SaveRaffleNewId = number
export async function saveRaffle(raffle: RafflePrizeData, user: GameUser, tickets: number, amount: number): Promise<SaveRaffleNewId> {
  // @TODO validate parameters
  try {
    const resp = await exec(`
      insert into raffle_history(raffle_id, game_user_id, tickets, raffle_numbers) VALUES (?,?,?,?)
    `, [raffle.id, user.id, tickets, amount])
    return resp.insertId as SaveRaffleNewId
  } catch (error) {
    throw createError(createError.InternalServerError, error)
  }
}
