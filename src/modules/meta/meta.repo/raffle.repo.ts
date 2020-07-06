/* eslint-disable babel/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
import camelcaseKeys from 'camelcase-keys'
import createError from 'http-errors'
import {query, queryOne, exec} from '../meta.db'
import {RafflePrizeData, LocalizationData, GameUser, RaffleRecordData, RafflePrizeDataDB} from '../meta.types'
import {getGameUserByDeviceId} from "../meta.service"
import {addRaffleAsTask} from '../meta-services/cron'
import {getRandomNumber} from "../../../helpers"
import {getWallet, updateWallet} from '../../slot/slot.services/wallet.service'

export const rafflePurchase = async (deviceId: string, id: number, amount: number): Promise<any> => {
  if(!deviceId) throw createError(createError.BadRequest, 'deviceId is a required parameter')
  if(!amount) throw createError(createError.BadRequest, 'amount is a required parameter')
  if(amount < 1) throw createError(createError.BadRequest, 'amount can not be less than 1')
  if(!id) throw createError(createError.BadRequest, 'raffleId is a required parameter')

  // @TODO trycatch
  const user = await getGameUserByDeviceId(deviceId)
  const wallet = await getWallet(deviceId)
  const raffle = await getRaffle(id)
  if (!raffle) throw createError(createError.BadRequest, 'there is no raffle with that ID')
  const raffleCostInTickets = raffle.raffleNumberPrice
  const totalTicketsNeeded = raffleCostInTickets * amount
  if (totalTicketsNeeded > wallet.tickets) throw createError(createError.BadRequest, 'Insufficient tickets')
  const raffleId = await saveRaffle(raffle, user, totalTicketsNeeded, amount)
  if(raffleId < 0) throw createError(createError.InternalServerError, 'Error saving raffle to db')
  wallet.tickets -= totalTicketsNeeded
  updateWallet(deviceId, wallet)
  // eslint-disable-next-line no-return-await
  return await getWallet(deviceId)
}
export async function getRaffles(fieldsToExclude: string[] | undefined = undefined, camelCased = true): Promise<RafflePrizeData[]> {
  const raffles = await query(`
    SELECT r.id, DATE_FORMAT(r.closing_date, '%Y/%m/%d') closing_date,
      r.raffle_number_price, r.texture_url, r.item_highlight
    FROM raffle r
  `) as RafflePrizeData[]
  for (const raffle of raffles) {
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
  fieldsToExclude: string[] | undefined = undefined, camelCased = true, rawAllFields = false): Promise<RafflePrizeData> {
  const select = rawAllFields
    ? `SELECT * FROM raffle r where r.id = ${id}`
    : `SELECT r.id, DATE_FORMAT(r.closing_date, '%Y/%m/%d') closing_date,
      r.raffle_number_price, r.texture_url, r.item_highlight
      FROM raffle r where r.id = ${id}`
  const raffle = await queryOne(select) as RafflePrizeData
  if (fieldsToExclude)
    fieldsToExclude.forEach((fieldToExclude) => delete raffle[fieldToExclude])

  // eslint-disable-next-line require-atomic-updates
  raffle.localizationData = await query(`
    select * from raffle_localization where raffle_id = ${raffle.id}
  `)
  return camelCased ? camelcaseKeys(raffle) : raffle as RafflePrizeData
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

export async function newRaffle(raffle: RafflePrizeDataDB): Promise<SaveRaffleNewId> {
  console.log('raffle', raffle)
  if (!raffle.localization_data || raffle.localization_data.length < 1)
    throw createError(createError.BadRequest, 'raffle.localizationData is required')
  const {localization_data, ...raffleForDB} = raffle
  const respRaffle = await exec(`insert into raffle SET ?`, raffleForDB)
  const newRaffleId = respRaffle.insertId
  for (const localizationData of localization_data) {
    localizationData.raffle_id = newRaffleId
    const respLocalization = await exec(`insert into raffle_localization SET ?`, localizationData)
    console.log("respLocalization", respLocalization)
  }
  const _raffle = await getRaffle(newRaffleId, undefined, false, true)
  addRaffleAsTask(_raffle)
  return newRaffleId as SaveRaffleNewId
}
export async function getRafflePurchaseHistory(deviceId: string): Promise<RaffleRecordData[]> {
  if (!deviceId) throw createError(createError.BadRequest, 'deviceId is a required parameter')
  const gameUser = await getGameUserByDeviceId(deviceId)
  const raffleHistory = await query(`
  SELECT rh.raffle_id as raffle_item_id, DATE_FORMAT(rh.transaction_date, '%Y/%m/%d') AS transaction_date, rh.tickets,
  DATE_FORMAT(rh.closing_date, '%Y/%m/%d') AS closing_date, rh.raffle_numbers
  FROM raffle_history rh where rh.game_user_id = ${gameUser.id}
  order by id desc
  limit 20
  `)
  return camelcaseKeys(raffleHistory)
}
export async function raffleTime(raffle: RafflePrizeData): Promise<any> {
  console.log('raffleTime raffle#%O', raffle.id)
  const purchases = await query(`
    select id, raffle_numbers as numbers, game_user_id, raffle_id
    from raffle_history
    where raffle_id = ${raffle.id}
  `)
  if(!purchases || purchases.length < 1) return false
  const totalNumbers = purchases.reduce((ant, current) => ant + current.numbers, 0)
  console.log('purchases', purchases, totalNumbers)
  let floor = 0
  const randomNumber = getRandomNumber(1, totalNumbers)
  const winner = purchases.find((purchase) => {
    const isWin = ((randomNumber > floor) && (randomNumber <= floor + Number(purchase.numbers)))
    floor += Number(purchase.numbers)
    return isWin
  })
  console.log('winner', winner)
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
    date_format(rh.closing_date, '%d/%m/%Y') as raffle_date, r.texture_url as raflePrizeTextureUrl,
      (
        select IF(count(*) = 0, '', rl.description) from raffle_localization rl where rl.raffle_id = r.id limit 1
      ) as rafflePrizeName
    from raffle_wins rw
      inner join raffle_history rh on rw.raffle_history_id = rh.id
      inner join game_user gu on rh.game_user_id = gu.id
      inner join raffle r on rh.raffle_id = r.id
  `)
  return camelcaseKeys(winners)
}
