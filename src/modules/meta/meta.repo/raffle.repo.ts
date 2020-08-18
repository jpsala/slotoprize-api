import { unlinkSync } from 'fs'
import {join} from 'path'
import snakeCaseKeys from 'snakecase-keys'
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {BAD_REQUEST} from 'http-status-codes'
/* eslint-disable babel/camelcase */
import camelcaseKeys from 'camelcase-keys'
import createError from 'http-errors'
import { format } from 'date-fns'
import { query, queryOne, exec } from '../../../db'
import { LocalizationData, RafflePrizeData, GameUser, RaffleRecordData, RafflePrizeDataDB } from '../meta.types'
import { getGameUserByDeviceId } from "../meta-services/meta.service"
import { getRandomNumber, saveFile } from "../../../helpers"
import { getWallet, updateWallet } from '../../slot/slot.services/wallet.service'
import { getReqUser } from "../authMiddleware"
import ParamRequiredException from '../../../error'
import { Wallet } from "../../slot/slot.types"
import { Localization } from './../models/localization'

import { dateToRule, updateRulesFromDb } from './../../slot/slot.services/events/events'
import { getGameUser } from './gameUser.repo'

export const rafflePurchase = async (deviceId: string, raffleId: number, amount: number): Promise<Wallet> => {
  if (!deviceId) throw createError(createError.BadRequest, 'deviceId is a required parameter')
  if (!amount) throw createError(createError.BadRequest, 'amount is a required parameter')
  if (amount < 1) throw createError(createError.BadRequest, 'amount can not be less than 1')
  if (isNaN(raffleId)) throw createError(createError.BadRequest, 'raffleId is a required parameter')

  const user = await getGameUserByDeviceId(deviceId)
  const wallet = await getWallet(deviceId)
  const raffle = await getRaffle(raffleId)
  if (!raffle) throw createError(createError.BadRequest, 'there is no raffle with that ID')
  const raffleCostInTickets = raffle.raffleNumberPrice
  const totalTicketsNeeded = raffleCostInTickets * amount
  if (totalTicketsNeeded > wallet.tickets) throw createError(createError.BadRequest, 'Insufficient tickets')
  const raffleInsertedId = await saveRaffle(raffle, user, totalTicketsNeeded, amount)
  if (raffleInsertedId < 0) throw createError(createError.InternalServerError, 'Error saving raffle to db')
  wallet.tickets -= totalTicketsNeeded
  await updateWallet(deviceId, wallet)
  // eslint-disable-next-line no-return-await
  return await getWallet(deviceId)
}
async function getRaffleLocalizationData(raffleId: number): Promise<LocalizationData> {
  const { languageCode } = await getGameUser(getReqUser().user as number)
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
    if (raffle == null) throw createError(BAD_REQUEST, 'no localization data for this raffle')
    if (name == null) throw createError(BAD_REQUEST, 'no localization data for this raffle')
    raffle.name = name
    raffle.description = description
    if (fieldsToExclude)
      fieldsToExclude.forEach((fieldToExclude) => delete raffle[fieldToExclude])
  }
  return camelCased ? camelcaseKeys(raffles) : raffles
}
export async function prizeNotified(raffleId: number): Promise<string> {
  if (isNaN(raffleId)) throw new ParamRequiredException('raffleId')
  const resp = await exec(`
  update raffle_history set notified = 1
    where win = 1 and raffle_id = ${raffleId} and notified = 0
  `)
  //console.log('resp.affectedRows', resp.affectedRows)
  if (resp.affectedRows < 1) throw createError(createError.BadRequest, 'No modifications, check raffleId')
  return 'ok'
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function getRafflesForCrud()
{

    const raffles = await query(`
      select r.id, date_format(r.closing_date, '%Y/%m/%d %H:%i') as closingDate, r.texture_url textureUrl,
          r.item_highlight itemHighlight, r.raffle_number_price price, rl.name, rl.description,
          concat(gu.last_name,', ',gu.first_name) as winner, gu.email, gu.device_id deviceID
      from raffle r
          inner join raffle_localization rl on r.id = rl.raffle_id and rl.language_code = 'en-US'
          left join game_user gu on r.winner = gu.id
      left join state s on rl.name = s.name
      order by r.closing_date asc
  `)
  for (const raffle of raffles)
    raffle.localization = await query(`
      select rl.* from raffle
        left join raffle_localization rl on raffle.id = rl.raffle_id
      where rl.raffle_id = ${raffle.id}
  `)
  const newRaffle = {
    "id": "-1",
    "closing_date": format(new Date(), 'yyyy/MM/dd HH:mm'),
    "raffle_number_price": 0,
    "texture_url": '',
    "item_highlight": 0,
    "winner": '',
    "isNew": true,
    "localization": await query(`select l.language_code, '' name, '' description from language l`)
  }
  const languages = await query('select * from language')
  return {raffles, languages, newRaffle}

}
export async function getRaffle(id: number,
  fieldsToExclude: string[] | undefined = undefined, camelCased = true, rawAllFields = false): Promise<RafflePrizeData> {
  const select = rawAllFields
    ? `SELECT r.*, rl.name, rl.description FROM raffle r
      inner join raffle_localization rl on r.id = rl.raffle_id and rl.language_code = 'en-US'
    where r.id = ${id}`
    : `SELECT r.id, closing_date, rl.name, rl.description,
      r.raffle_number_price, r.texture_url, r.item_highlight
      FROM raffle r
      inner join raffle_localization rl on r.id = rl.raffle_id and rl.language_code = 'en-US'
      where r.id = ${id}`
  const raffle = await queryOne(select) as RafflePrizeData
  if (fieldsToExclude)
    fieldsToExclude.forEach((fieldToExclude) => delete raffle[fieldToExclude])
  if (raffle)
    raffle.localizationData = await query(`
      select * from raffle_localization where raffle_id = ${raffle.id}
    `)

  return camelCased ? camelcaseKeys(raffle) : raffle
}
export async function saveRaffle(raffle: RafflePrizeData, user: GameUser, tickets: number, amount: number): Promise<number> {
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
export async function newRaffle(raffle: any, files: any): Promise<any>
{
  console.log('raffle.closingDate', raffle.closingDate, raffle)
  const image = files.image
  const localizationData = JSON.parse(raffle.localization)
  const date = raffle.closingDate ? new Date(raffle.closingDate) : new Date()
  const raffleForDB = {
    "id": raffle.id,
    "closing_date": format(date, 'yyyy/MM/dd HH:mm:ss'),
    "raffle_number_price": raffle.raffle_number_price || 0,
    "texture_url": raffle.textureUrl || '',
    "item_highlight": 0
  }
  console.log('raffleForDB', raffleForDB)
  throw new Error('hola')
  if (!localizationData || localizationData.length < 1)
    throw createError(createError.BadRequest, 'raffle.localizationData is required')
  for (const localization of localizationData)
    if (localization.name === '' || localization.description === '')
      throw new Error('missing')

  const isNew = raffle.isNew === 'true'

  let respRaffle
  if (isNew) {
    delete raffleForDB.id
    respRaffle = await exec(`insert into raffle SET ?`, raffleForDB)
  } else {
    respRaffle = await exec(`update raffle SET ? where id = ${raffleForDB.id}`, raffleForDB)
  }

  const raffleId = isNew ? respRaffle.insertId : raffle.id

  for (const localizationDataRow of localizationData) {
    localizationDataRow.raffle_id = raffleId
    const localizationData = await queryOne(`
      select id from raffle_localization
        where raffle_id = ${raffleId} and language_code = "${localizationDataRow.language_code}"`)
    if (localizationData?.id) {
      console.log('localizationData', localizationData.id, snakeCaseKeys(localizationDataRow))
      await exec(`
        update raffle_localization SET ? where id = ${localizationData.id} `,
        snakeCaseKeys(localizationDataRow)
      )
    } else {
      await exec(`
      insert into raffle_localization SET ?`,
      snakeCaseKeys(localizationDataRow)
    )
    }

  }

  const _raffle = await getRaffle(raffleId, undefined, true, true) as any
  if (image) {
    const saveResp = saveFile({ file: image, path: 'raffleItems', id: String(_raffle.id), delete: true })
    if(!saveResp) throw new Error('could not save image for this raffle')
    await exec(`update raffle set texture_url = ? where id = ${_raffle.id}`, [saveResp.url])
    _raffle.textureUrl = saveResp.url
  }
  const rule = dateToRule(_raffle.closingDate)
  await exec(`insert into event set ? `, [
    {
      "eventType": "raffle",
      "name": _raffle.localizationData[0]?.name,
      rule,
      "duration": 0,
      "active": 1,
      "data": JSON.stringify({ id: _raffle.id })
    }
  ])
  await updateRulesFromDb()
  _raffle.closingDate = format(new Date(_raffle.closingDate), 'yyyy/MM/dd HH:mm')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return _raffle
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
  return camelcaseKeys(raffleHistory) as RaffleRecordData[]
}
export async function raffleTime(raffleId: number): Promise<any> {
  console.log('reffleTime', raffleId)
  const purchases: { id: number, numbers: number, game_user_id: number }[] = await query(`
    select id, raffle_numbers as numbers, game_user_id, raffle_id
    from raffle_history
    where raffle_id = ${raffleId}
  `)
  if (!purchases || purchases.length < 1) return false
  const totalNumbers = purchases.reduce((ant: number, current) => ant + current.numbers, 0)
  let floor = 0
  const randomNumber = getRandomNumber(1, totalNumbers)
  const winnerRaffleHistory = purchases.find((purchase) => {
    const isWin = ((randomNumber > floor) && (randomNumber <= floor + Number(purchase.numbers)))
    floor += Number(purchase.numbers)
    return isWin
  })
  console.log('winner', raffleId, winnerRaffleHistory)
  if (!winnerRaffleHistory) throw new Error('There was a problem in raffle time')
  await saveWinner(winnerRaffleHistory.id)
  await exec(`update raffle set winner = ${winnerRaffleHistory.game_user_id} where id = ${raffleId}`)
  await exec(`update raffle_history set win = 1 where id = ${winnerRaffleHistory.id}`)
  return winnerRaffleHistory
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return camelcaseKeys(winners)
}
