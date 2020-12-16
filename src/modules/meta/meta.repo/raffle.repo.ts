import createError from 'http-errors'
/* eslint-disable import/no-named-as-default-member */
import snakeCaseKeys from 'snakecase-keys'
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {BAD_REQUEST} from 'http-status-codes'
/* eslint-disable babel/camelcase */
import camelcaseKeys from 'camelcase-keys'

import { format} from 'date-fns'
import moment from "moment"
import { query, queryOne, queryExec } from '../../../db'
import { LocalizationData, RafflePrizeData, GameUser, RaffleRecordData } from '../meta.types'
import { getGameUserByDeviceId } from "../meta-services/meta.service"
import { addHostToPath, getRandomNumber, getUrlWithoutHost, isNotebook, saveFile , getAssetsUrl } from "../../../helpers"
import { updateWallet, getWallet } from '../../slot/slot.services/wallet.service'
import ParamRequiredException from '../../../error'
import { Wallet } from "../../slot/slot.types"


import { getSetting } from '../../slot/slot.services/settings.service'
import { getUserConnection, WebSocketMessage, wsServer } from '../../slot/slot.services/webSocket/ws.service'
import { deleteEvent } from '../../slot/slot.repo/event.repo'
import { dateToRule, reloadRulesFromDb } from './../../slot/slot.services/events/events'
import { getHaveWinRaffle, getHaveProfile, getWinRaffle, resetPendingPrize  } from './gameUser.repo'

export const rafflePurchase = async (deviceId: string, raffleId: number, amount: number): Promise<Wallet> => {
  if (!deviceId) throw createError(createError.BadRequest, 'deviceId is a required parameter')
  if (!amount) throw createError(createError.BadRequest, 'amount is a required parameter')
  if (amount < 1) throw createError(createError.BadRequest, 'amount can not be less than 1')
  if (isNaN(raffleId)) throw createError(createError.BadRequest, 'raffleId is a required parameter')

  const user = await getGameUserByDeviceId(deviceId)
  const wallet = await getWallet(user)
  const raffle = await getRaffle(raffleId,undefined,true,true)
  console.log('raffle', raffle)
  if (!raffle) throw createError(createError.BadRequest, 'there is no raffle with that ID')
  if(raffle.winner || raffle.closed) throw createError(createError.BadRequest, 'The raffle has been raffled')
  const raffleCostInTickets = raffle.raffleNumberPrice
  const totalTicketsNeeded = raffleCostInTickets * amount
  if (totalTicketsNeeded > wallet.tickets) throw createError(createError.BadRequest, 'Insufficient tickets')
  const raffleInsertedId = await saveRaffle(raffle, user, totalTicketsNeeded, amount)
  if (raffleInsertedId < 0) throw createError(createError.InternalServerError, 'Error saving raffle to db')
  wallet.tickets -= totalTicketsNeeded
  await updateWallet(user, wallet)
  return await getWallet(user)
}
async function getRaffleLocalizationData(user: GameUser,raffleId: number): Promise<LocalizationData> {
  const { languageCode } = user
  const localizationData = await queryOne(`
    select * from raffle_localization
      where raffle_id = ${raffleId} and language_code = "${languageCode}"
  `)
  if (!localizationData)
    return {
      id: -1,
      raffleId: -1,
      languageCode: languageCode,
      name: 'No localization for ' + languageCode,
      description: 'No localization for '+ languageCode
    }

  return camelcaseKeys(localizationData) as LocalizationData
}
export async function getRaffles(user: GameUser, onlyLive = false): Promise<RafflePrizeData[]> {
  const url = getAssetsUrl()
  const where = onlyLive ? ' CURRENT_TIMESTAMP() BETWEEN r.live_date and r.closing_date ' : ' true '
    
    const raffles = await query(`
      SELECT r.id, r.closing_date, r.raffle_number_price, concat('${url}', r.texture_url) as texture_url, r.item_highlight, 
            coalesce((select sum(coalesce(rh2.raffle_numbers, 0)) from raffle_history rh2 where rh2.game_user_id = ${user.id} and rh2.raffle_id = r.id), 0) as participationsPurchased
      FROM raffle r
        left join raffle_history rh on r.id = rh.raffle_id
      where ${where}
      group by r.id
  `) as RafflePrizeData[]
  for (const raffle of raffles) {
    const { name, description } = await getRaffleLocalizationData(user, raffle.id)
    if (raffle == null) throw createError(BAD_REQUEST, 'no localization data for this raffle')
    if (name == null) throw createError(BAD_REQUEST, 'no localization data for this raffle')
    raffle.name = name
    raffle.description = description
  }
  return camelcaseKeys(raffles)
}
export async function prizeNotified(raffleId: number): Promise<string> {
  if (isNaN(raffleId)) throw new ParamRequiredException('raffleId')
  const resp = await queryExec(`
  update raffle_history set notified = 1
    where win = 1 and raffle_id = ${raffleId} and notified = 0
  `)
  //console.log('resp.affectedRows', resp.affectedRows)
  if (resp.affectedRows < 1) throw createError(createError.BadRequest, 'No modifications, check raffleId')
  return 'ok'
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function getRafflesForCrud(id?: number)
{
  const url = getAssetsUrl()
  const languageCode = await getSetting('languageCode', 'fr-FR')

  const where = id ? ` where r.id = ${id} ` : ''
 
  const raffles = await query(`
    select r.id, r.state, rl.name, rl.description, gu.email, gu.device_id deviceID,
            date_format(r.closing_date, '%Y-%m-%d %H:%i:%s') as closingDate,
            date_format(r.live_date, '%Y-%m-%d %H:%i:%s') as liveDate,
            concat('${url}', r.texture_url) as textureUrl, r.item_highlight itemHighlight, r.raffle_number_price price,
            IF(CURRENT_TIMESTAMP() BETWEEN r.live_date and r.closing_date, true, false) as isLive,
            concat(gu.last_name,', ',gu.first_name) as winner, gu.id as gameUserId,
            (select sum(raffle_numbers) as sold from raffle_history where raffle_id = r.id) as sold
    from raffle r
        inner join raffle_localization rl on r.id = rl.raffle_id and rl.language_code = '${languageCode}'
        left join game_user gu on r.winner = gu.id
        left join state s on rl.name = s.name
    ${where}
    order by r.closing_date desc
  `)
  for (const raffle of raffles) {
    const closingDate = moment.utc(raffle.closingDate)
    const diff = closingDate.diff(moment.utc(), 'seconds')
    const diffH = moment.duration(diff, 'seconds')
    const isPast = diff <= 0
    raffle.isPast = isPast
    if (raffle.gameUserId) {
      const hasPendingPrize = await getHaveWinRaffle(raffle.gameUserId as number)
      raffle.requireProfileData = hasPendingPrize && !await getHaveProfile(raffle.gameUserId as number)
    }else {raffle.requireProfileData = true}
    raffle.distance = diffH.humanize()
    raffle.localization = await query(`
      select rl.* from raffle
        left join raffle_localization rl on raffle.id = rl.raffle_id
      where rl.raffle_id = ${raffle.id}
    `)
  }
  if (!id) {
    const newRaffle = {
      "id": "-1",
      "closingDate": format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      "liveDate": format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      "price": 0,
      "textureUrl": '',
      "itemHighlight": 0,
      "winner": '',
      "isNew": true,
      "localization": await query(`select l.language_code, '' name, '' description from language l`)
    }

    const url = getAssetsUrl()
    const languages = await query(`select id, language_code,
        concat('${url}',texture_url) as texture_url
         from language`)
    return { raffles, languages, newRaffle }
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return raffles[0]
}
export async function getRaffle(id: number,
  fieldsToExclude: string[] | undefined = undefined, camelCased = true, rawAllFields = false): Promise<RafflePrizeData> {
  const url = getAssetsUrl()
  const languageCode = await getSetting('languageCode', 'fr-FR')

  const select = rawAllFields
    ? `SELECT r.*, rl.name, rl.description, (r.closing_date < current_timestamp) as closed FROM raffle r
      inner join raffle_localization rl on r.id = rl.raffle_id and rl.language_code = '${languageCode}'
    where r.id = ${id}`
    : `SELECT r.id, closing_date, rl.name, rl.description,
      r.raffle_number_price, concat('${url}', r.texture_url) as texture_url, r.item_highlight
      FROM raffle r
      left join raffle_localization rl on r.id = rl.raffle_id and rl.language_code = '${languageCode}'
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
  // TODO validate parameters
  try {
    const resp = await queryExec(`
      insert into raffle_history(raffle_id, game_user_id, tickets, raffle_numbers) VALUES (?,?,?,?)
    `, [raffle.id, user.id, tickets, amount])
    return resp.insertId
  } catch (error) {
    throw createError(createError.InternalServerError, error)
  }
}
export async function deleteRaffle(id: string): Promise<any>
{
  const eventData = JSON.stringify({"id": Number(id)})
  const respEvent = await queryExec(`delete from event where data = '${eventData}'`)
  console.log('respEvent', respEvent, eventData)
  const resp = await queryExec(`delete from raffle where id = ${id}`)
  console.log('resp', )
  return resp.affectedRows === 1
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function postRaffle(raffle: any, files: any): Promise<any>
{
  const image = files.image
  const localizationData = JSON.parse(raffle.localization)

  const closingDate = raffle.closingDate ? new Date(raffle.closingDate) : new Date()
  const liveDate = raffle.liveDate ? new Date(raffle.liveDate) : new Date()

  const liveDateUtc = moment(raffle.liveDate)

  const closingDateUtc = isNotebook() ? moment(raffle.closingDate) : moment.utc(raffle.closingDate)
  const diffLiveDate = closingDateUtc.diff(isNotebook() ? liveDateUtc : liveDateUtc.utc(), 'seconds')
  const diffClosigDate = closingDateUtc.diff(isNotebook() ? moment() : moment.utc(), 'seconds')

  raffle.textureUrl =  getUrlWithoutHost(raffle.textureUrl)
  if(diffClosigDate <= 0 && (raffle.state === 'new' || !raffle.state)) throw createError(BAD_REQUEST, 'raffle closing date can not be in the past')
  if(diffLiveDate <= 0 && (raffle.state === 'new' || !raffle.state)) throw createError(BAD_REQUEST, 'raffle live date can not be after closing date')
  const raffleForDB = {
    id: raffle.id,
    closing_date: format(closingDate, 'yyyy-MM-dd HH:mm:ss'),
    live_date: format(liveDate, 'yyyy-MM-dd HH:mm:ss'),
    raffle_number_price: raffle.price || 0,
    texture_url: raffle.textureUrl || '',
    item_highlight: 0,
    state: raffle.state || 'new'
  }
  if (!localizationData || localizationData.length < 1)
    throw createError(createError.BadRequest, 'raffle.localizationData is required')
  if(Number(raffleForDB.raffle_number_price) <= 0)
    throw createError(createError.BadRequest, 'raffle.price is required to be greater than 0')
  for (const localization of localizationData)
    if (localization.name === '' || localization.description === '')
      throw createError(BAD_REQUEST, 'Missing localization name or description')

  const isNew = raffle.isNew === 'true'
  if(!files.image && !raffleForDB.texture_url) throw createError(BAD_REQUEST, 'Missing image')

  let respRaffle
  if (isNew) {
    delete raffleForDB.id
    respRaffle = await queryExec(`insert into raffle SET ?`, raffleForDB)
  } else {
    respRaffle = await queryExec(`update raffle SET ? where id = ${raffleForDB.id}`, raffleForDB)
  }
  const raffleId = isNew ? respRaffle.insertId : raffle.id
  console.log('raffleId', raffleId)
  for (const localizationDataRow of localizationData) {
    localizationDataRow.raffle_id = raffleId
    const localizationData = await queryOne(`
      select id from raffle_localization
        where raffle_id = ${raffleId} and language_code = "${localizationDataRow.language_code}"`)
    if (localizationData?.id) {
      console.log('localizationData', localizationData.id, snakeCaseKeys(localizationDataRow))
      await queryExec(`
        update raffle_localization SET ? where id = ${localizationData.id} `,
        snakeCaseKeys(localizationDataRow)
      )
    } else {
      await queryExec(`
      insert into raffle_localization SET ?`,
      snakeCaseKeys(localizationDataRow)
    )
    }
  }

  const _raffle = await getRafflesForCrud(raffleId)
  if (image) {
    const saveResp = saveFile({ file: image, path: 'raffleItems', id: String(_raffle.id), delete: true })
    if(!saveResp) throw new Error('could not save image for this raffle')
    await queryExec(`update raffle set texture_url = ? where id = ${_raffle.id}`, [saveResp.url])
    _raffle.textureUrl = saveResp.url
  }
  
  const rule = `{ "type": "cron", "rule": "${dateToRule(new Date(_raffle.closingDate))}" }`
  const eventIdAnt = JSON.stringify({ "id": _raffle.id })
  await queryExec(`delete from event where data = '${eventIdAnt}'`)
  await queryExec(`insert into event set ? `, [
    {
      "eventType": "raffle",
      "name": _raffle.localization[0]?.name,
      rule,
      "duration": 0,
      "active": 1,
      "data": JSON.stringify({ id: _raffle.id })
    }
  ])
  await reloadRulesFromDb()
  _raffle.closingDate = format(new Date(_raffle.closingDate), 'yyyy-MM-dd HH:mm:ss')
  if(image)_raffle.textureUrl = addHostToPath(_raffle.textureUrl)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return _raffle
}
export async function getRafflePurchaseHistory(deviceId: string): Promise<RaffleRecordData[]> {
  if (!deviceId) throw createError(createError.BadRequest, 'deviceId is a required parameter')
  const gameUser = await getGameUserByDeviceId(deviceId)
  const raffleHistory = await query(`
    SELECT rh.raffle_id as raffle_item_id, rh.transaction_date, rh.tickets,
           raffle.closing_date, rh.raffle_numbers, 
           (
            select IF(count(*) = 0, concat('No localization for ', '${gameUser.languageCode}'), rl.name) from raffle_localization rl
              where rl.raffle_id = rh.raffle_id and rl.language_code = '${gameUser.languageCode}' limit 1
          ) as name, coalesce(rl.description, concat('No localization for ', '${gameUser.languageCode}')) description
    FROM raffle_history rh
        inner join raffle on rh.raffle_id = raffle.id
        left join raffle_localization rl on raffle.id = rl.raffle_id and
              rl.language_code = "${gameUser.languageCode}"
    where rh.game_user_id = ${gameUser.id}
    order by raffle.closing_date desc
    limit 20
  `)
  return camelcaseKeys(raffleHistory) as RaffleRecordData[]
}
export async function raffleTime(raffleId: number): Promise<any> {

  console.log('reffleTime!!! raffleId', raffleId)

  const purchases: { id: number, numbers: number, game_user_id: number }[] = await query(`
    select id, raffle_numbers as numbers, game_user_id, raffle_id
    from raffle_history
    where raffle_id = ${raffleId}
  `)
  if (!purchases || purchases.length < 1) {
    await queryExec(`update raffle set state = "nowinner" where id = ${raffleId}`)
    const eventData = JSON.stringify({"id": Number(raffleId)})
    await queryExec(`delete from event where data = '${eventData}'`)
    await reloadRulesFromDb()
    console.log('no purchases, skipping')
    return false
  }
  console.log('raffleTime, purchases ', purchases.length)

  const totalNumbers = purchases.reduce((ant: number, current) => ant + current.numbers, 0)
  let floor = 0
  const randomNumber = getRandomNumber(1, totalNumbers)
  const raffleWinner = purchases.find((purchase) => {
    const isWin = ((randomNumber > floor) && (randomNumber <= floor + Number(purchase.numbers)))
    floor += Number(purchase.numbers)
    return isWin
  })

  if (!raffleWinner) throw new Error(`Someghing was wrong with this raffle ${raffleId}` ) 

  await saveWinner(raffleWinner.id)

  const eventDataForDb = JSON.stringify({"id": Number(raffleId)})
  const eventForDeletion = await queryOne(`select id from event where data = '${eventDataForDb}'`)
  
  await queryExec(`update raffle set winner = ${raffleWinner.game_user_id}, state = "won" where id = ${raffleId}`)
  await queryExec(`update raffle_history set win = 1 where id = ${raffleWinner.id}`)
  
  console.log('raffleTime, raffle# %O have a winner!!! %O', raffleId, raffleWinner)
  
  await sendEventToWinner(raffleWinner.game_user_id)

  await deleteEvent(eventForDeletion.id)

  return raffleWinner
}
async function sendEventToWinner(userId: number): Promise<void> {
  const rafflePrizeData = await getWinRaffle(userId)
  const userConnection = getUserConnection(userId)
  if(userConnection){
    const wsMessage: WebSocketMessage = {
      code: 200,message: 'OK',msgType: 'raffleWin',payload: rafflePrizeData
    }
    wsServer.send(wsMessage, userConnection.client)
    console.log('raffleTime', 'Sended event to winner %O', wsMessage)
    await resetPendingPrize(userId)
  } else {console.log('raffleTime, user is not connected for the event to be send' )}
}
async function saveWinner(raffleHistoryId: number): Promise<void> {
  await queryExec(`
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
export const getWinners = async (): Promise<any[]> =>
//URGENT ordenar de mas nuevo a mas viejo
{
  const url = getAssetsUrl()
  const winners = await query(`
  select concat(gu.first_name, ', ', gu.last_name) as winnerName,
    r.closing_date as date , concat('${url}', r.texture_url) as textureUrl,
      (
        select IF(count(*) = 0, concat('No localization for ', gu.language_code), rl.name) from raffle_localization rl
          where rl.raffle_id = r.id and rl.language_code = gu.language_code limit 1
      ) as prizeName
    from raffle_wins rw
      inner join raffle_history rh on rw.raffle_history_id = rh.id
      inner join game_user gu on rh.game_user_id = gu.id
      inner join raffle r on rh.raffle_id = r.id
    order by r.closing_date desc
  `)
  // return camelcaseKeys(winners.map((winnerRow) => { return {raffleWinnerData: winnerRow} }))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return camelcaseKeys(winners)
}
