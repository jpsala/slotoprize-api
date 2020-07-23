import statusCodes from 'http-status-codes'
/* eslint-disable babel/camelcase */
import camelcaseKeys from 'camelcase-keys'
import createError from 'http-errors'
import { lorem } from 'faker'
import {query, queryOne, exec} from '../../../db'
import {LocalizationData, RafflePrizeData, GameUser, RaffleRecordData, RafflePrizeDataDB} from '../meta.types'
import {getGameUserByDeviceId} from "../meta-services/meta.service"
import {addRaffleAsTask} from '../meta-services/cron'
import {getRandomNumber} from "../../../helpers"
import {getWallet, updateWallet} from '../../slot/slot.services/wallet.service'

import {getReqUser} from "../authMiddleware"


import ParamRequiredException from '../../../error'
import {Wallet} from "../../slot/slot.types"
import {getGameUser} from './gameUser.repo'

export const rafflePurchase = async (deviceId: string, raffleId: number, amount: number): Promise<Wallet> => {
  if(!deviceId) throw createError(createError.BadRequest, 'deviceId is a required parameter')
  if(!amount) throw createError(createError.BadRequest, 'amount is a required parameter')
  if(amount < 1) throw createError(createError.BadRequest, 'amount can not be less than 1')
  if(isNaN(raffleId)) throw createError(createError.BadRequest, 'raffleId is a required parameter')

  const user = await getGameUserByDeviceId(deviceId)
  const wallet = await getWallet(deviceId)
  const raffle = await getRaffle(raffleId)
  if (!raffle) throw createError(createError.BadRequest, 'there is no raffle with that ID')
  const raffleCostInTickets = raffle.raffleNumberPrice
  const totalTicketsNeeded = raffleCostInTickets * amount
  if (totalTicketsNeeded > wallet.tickets) throw createError(createError.BadRequest, 'Insufficient tickets')
  const raffleInsertedId = await saveRaffle(raffle, user, totalTicketsNeeded, amount)
  if(raffleInsertedId < 0) throw createError(createError.InternalServerError, 'Error saving raffle to db')
  wallet.tickets -= totalTicketsNeeded
  await updateWallet(deviceId, wallet)
  // eslint-disable-next-line no-return-await
  return await getWallet(deviceId)
}
async function getRaffleLocalizationData(raffleId: number): Promise<LocalizationData> {
  const {languageCode} = await getGameUser(getReqUser().user as number)
  const localizationData = await queryOne(`
    select * from raffle_localization
      where raffle_id = ${raffleId} and language_code = "${languageCode}"
  `)
  return camelcaseKeys(localizationData) as LocalizationData
}

export async function getRaffles(fieldsToExclude: string[] | undefined = undefined, camelCased = true): Promise<RafflePrizeData[]> {
  const raffles = await query(`
    SELECT r.id, r.closing_date,
      r.raffle_number_price, r.texture_url, r.item_highlight
    FROM raffle r
  `) as RafflePrizeData[]
  for (const raffle of raffles) {
    const { name, description } = await getRaffleLocalizationData(raffle.id)
    console.log('name', name)
    if(raffle == null) throw createError(statusCodes.BAD_REQUEST, 'no localization data for this raffle')
    if(name == null) throw createError(statusCodes.BAD_REQUEST, 'no localization data for this raffle')
    raffle.name = name
    raffle.description = description
    // const resp = await query(`
    //   select language_code, name, description from raffle_localization rl where rl.raffle_id = ${raffle.id}
    // `) as LocalizationData[]
    // const localizationData = camelCased ? camelcaseKeys(resp) : resp
    // // eslint-disable-next-line require-atomic-updates
    // raffle.localizationData = localizationData
    if (fieldsToExclude)
      fieldsToExclude.forEach((fieldToExclude) => delete raffle[fieldToExclude])
  }
  return camelCased ? camelcaseKeys(raffles) : raffles
}
export async function prizeNotified(raffleId: number): Promise<string> {
  if(isNaN(raffleId)) throw new ParamRequiredException('raffleId')
  const resp = await exec(`
  update raffle_history set notified = 1
    where win = 1 and raffle_id = ${raffleId} and notified = 0
  `)
  //console.log('resp.affectedRows', resp.affectedRows)
  if(resp.affectedRows < 1) throw createError(createError.BadRequest, 'No modifications, check raffleId')
  return 'ok'
}
export async function getRaffle(id: number,
  fieldsToExclude: string[] | undefined = undefined, camelCased = true, rawAllFields = false): Promise<RafflePrizeData> {
  const select = rawAllFields
    ? `SELECT * FROM raffle r where r.id = ${id}`
    : `SELECT r.id, closing_date,
      r.raffle_number_price, r.texture_url, r.item_highlight
      FROM raffle r where r.id = ${id}`
  const raffle = await queryOne(select) as RafflePrizeData
  if (fieldsToExclude)
    fieldsToExclude.forEach((fieldToExclude) => delete raffle[fieldToExclude])
  if (raffle)
    raffle.localizationData = await query(`
      select * from raffle_localization where raffle_id = ${raffle.id}
    `)

  return camelCased ? camelcaseKeys(raffle) : raffle
}
type SaveRaffleNewId = number
export async function saveRaffle(raffle: RafflePrizeData, user: GameUser, tickets: number, amount: number): Promise<SaveRaffleNewId> {
  // @TODO validate parameters
  try {
    const resp = await exec(`
      insert into raffle_history(raffle_id, game_user_id, tickets, raffle_numbers) VALUES (?,?,?,?)
    `, [raffle.id, user.id, tickets, amount])
    return resp.insertId
  } catch (error) {
    throw createError(createError.InternalServerError, error)
  }
}
export async function newRaffle(raffle: RafflePrizeDataDB): Promise<SaveRaffleNewId> {
  //console.log('raffle', raffle)
  if (!raffle.localization_data || raffle.localization_data.length < 1)
    throw createError(createError.BadRequest, 'raffle.localizationData is required')
  const {localization_data, ...raffleForDB} = raffle
  const respRaffle = await exec(`insert into raffle SET ?`, raffleForDB)
  const newRaffleId = respRaffle.insertId
  for (const localizationData of localization_data) {
    localizationData.raffle_id = newRaffleId
    const respLocalization = await exec(`insert into raffle_localization SET ?`, localizationData)
    //console.log("respLocalization", respLocalization)
  }
  const _raffle = await getRaffle(newRaffleId, undefined, false, true)
  addRaffleAsTask(_raffle)
  return newRaffleId
}
export async function getRafflePurchaseHistory(deviceId: string): Promise<RaffleRecordData[]> {
  if (!deviceId) throw createError(createError.BadRequest, 'deviceId is a required parameter')
  const gameUser = await getGameUserByDeviceId(deviceId)
  const raffleHistory = await query(`
    SELECT rh.raffle_id as raffle_item_id, rh.transaction_date, rh.tickets,
           rh.closing_date, rh.raffle_numbers, rl.name, rl.description
    FROM raffle_history rh
        inner join raffle on rh.raffle_id = raffle.id
        inner join raffle_localization rl on raffle.id = rl.raffle_id and
                                             rl.language_code = "${gameUser.languageCode}"
    where rh.game_user_id = ${gameUser.id}
    order by rh.id desc
    limit 20
  `)
  return camelcaseKeys(raffleHistory)
}
export async function raffleTime(raffle: RafflePrizeData): Promise<any> {
  //console.log('raffleTime raffle#%O', raffle.id)
  const purchases = await query(`
    select id, raffle_numbers as numbers, game_user_id, raffle_id
    from raffle_history
    where raffle_id = ${raffle.id}
  `)
  if(!purchases || purchases.length < 1) return false
  const totalNumbers = purchases.reduce((ant, current) => ant + current.numbers, 0)
  //console.log('purchases', purchases, totalNumbers)
  let floor = 0
  const randomNumber = getRandomNumber(1, totalNumbers)
  const winner = purchases.find((purchase) => {
    const isWin = ((randomNumber > floor) && (randomNumber <= floor + Number(purchase.numbers)))
    floor += Number(purchase.numbers)
    return isWin
  })
  //console.log('winner', winner)
  await saveWinner(winner.id)
  await exec(`update raffle set winner = ${winner.game_user_id}`)
  await exec(`update raffle_history set win = 1 where id = ${winner.id}`)
  return winner
}
async function saveWinner(raffleHistoryId: number): Promise<void> {
  await exec(`
    insert into raffle_wins(raffle_history_id) values(${raffleHistoryId})
  `)
}

/*
    public class RaffleRecordData
    {
        public DateTime transactionDate;
        public int tickets;
        public DateTime closingDate;
        public int raffleNumbers;
        public int raffleItemId;
    }

*/
export const getWinners = async (): Promise<any[]> => {
  const winners = await query(`
  select concat(gu.first_name, ', ', gu.last_name) as raffleWinnerName,
  rh.closing_date, r.texture_url as raflePrizeTextureUrl,
    (
      select IF(count(*) = 0, '', rl.description) from raffle_localization rl
        where rl.raffle_id = r.id and rl.language_code = gu.language_code limit 1
    ) as rafflePrizeName
  from raffle_wins rw
    inner join raffle_history rh on rw.raffle_history_id = rh.id
    inner join game_user gu on rh.game_user_id = gu.id
    inner join raffle r on rh.raffle_id = r.id
  `)
  // return camelcaseKeys(winners.map((winnerRow) => { return {raffleWinnerData: winnerRow} }))
  return camelcaseKeys(winners)
}
