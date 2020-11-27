import toCamelCase from 'camelcase-keys'
import { Request, Response } from 'express'
import formidable from 'formidable'
import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import { log } from '../../log'
import { getNewToken, verifyToken } from '../../services/jwtService'
import * as metaService from '../meta/meta-services'
import { getAtlas } from '../meta/meta-services/atlas'
import { sendMail } from '../meta/meta-services/email.service'
import { getLocalizationJSON, getLocalizations, postLocalizations, postSettingsForLocalization, updateLocalizationJSON } from '../meta/meta-services/localization.service'
import { getWinnersForCrud, postWinnersStatusForCrud } from '../meta/meta-services/winner.service'
import { gameUserRepo } from '../meta/meta.repo'
import { getCountries, getCountriesForCrud, postCountryForCrud } from '../meta/meta.repo/country.repo'
import { getGameUserById, getLoginData, getPlayerForFront, getPlayersForFront, postToggleBanForCrud, setLanguageCode } from '../meta/meta.repo/gameUser.repo'
import { setIap } from '../meta/meta.repo/iap.service'
import { deleteLanguageForCrud, getLanguagesForCrud, postLanguageForCrud, postLanguageDefaultForCrud, toggleDeleteLanguageForCrud } from '../meta/meta.repo/language.repo'
import * as raffleRepo from '../meta/meta.repo/raffle.repo'
import { deleteRaffle, getRafflesForCrud, postRaffle } from '../meta/meta.repo/raffle.repo'
import { getSupportRequestForCrud, postSupportAdminForCrud, setSoporte, supportAdminForCrud } from '../meta/meta.repo/support.repo'
import { GameUser, User } from "../meta/meta.types"
import { getGameUserByDeviceId } from './../meta/meta-services/meta.service'
import { dailyRewardClaim, dailyRewardInfo, deleteDailyRewardPrize, getDailyRewardPrizesForCrud, setDailyRewardPrize } from './slot.repo/dailyReward.repo'
import { deleteEvent, getEventsForCrud, setEvent } from './slot.repo/event.repo'
import { deleteSkinForCrud, getSkinsForCrud, postSkinForCrud } from './slot.repo/skin.repo'
import { testUser39 } from './slot.repo/spin.regeneration.repo'
import * as slotService from './slot.services'
import { getAdsSettingsForCrud, postAdsSettingsForCrud } from './slot.services/addSettings.service'
import { appodealCallback, appodealCallbackPlain, QueryParams } from './slot.services/appodeal'
import { getCardSetsForCrud, getCardsForCrud, postCardSetsForCrud } from './slot.services/card.service'
import { getAllEvents, reloadRulesFromDb } from './slot.services/events/events'
import { callback, getVideoAdsViewCountForCrud } from './slot.services/ironsource'
import { getJackpotData, jackpotPost } from './slot.services/jackpot.service'
import { getLegals, getLegalsForCrud, postLegalsForCrud } from './slot.services/legals.service'
import { getMiscSettingsForCrud, postMiscSettingsForCrud } from './slot.services/miscSettings'
import { getPrizes, PrizeWinners } from './slot.services/prizes.service'
import { setProfile } from './slot.services/profile.service'
import { resetSettings, setSetting } from './slot.services/settings.service'
import { getSpinSettingsForCrud, setSpinSettingsForCrud } from './slot.services/spinForCrud.service'
// import {spin} from './slot.services/spin.service'
import { deleteSymbol, getSymbols, setSymbol, symbolsInDB } from './slot.services/symbol.service'
import { tapjoyCallback } from './slot.services/tapjoy'
import { getTicketsSettingsForCrud, postTicketsSettingsForCrud } from "./slot.services/ticketsSettings.service"
import { getSlotData, getTombolaForCrud, postTombolaForCrud, postWinLoseForTombolaCrudPost } from './slot.services/tombola.service'
import * as walletService from "./slot.services/wallet.service"



export async function playerForFrontGet(req: Request, res: Response): Promise<any>{
  console.log('req', req)
  const resp = await getPlayerForFront(String(req.query.id))
  res.status(200).json(resp)
}
export async function maxAllowedBirthYearPost(req: Request, res: Response): Promise<any>{
  await setSetting('maxAllowedBirthYear', req.body.maxAllowedBirthYear)
  res.status(200).json({status: 'ok'})
}
export async function maxAllowedBirthYearForCrudPost(req: Request, res: Response): Promise<any>{
  await setSetting('maxAllowedBirthYear', req.body.maxAllowedBirthYear)
  res.status(200).json({status: 'ok'})
}
export async function playersForFrontGet(req: Request, res: Response): Promise<any>{
  const resp = await getPlayersForFront(String(req.query.filter))
  res.status(200).json(resp)
}
export async function toggleBanForCrudPost(req: Request, res: Response): Promise<any>{
  const resp = await postToggleBanForCrud(Number(req.query.id))
  res.status(200).json(resp)
}
export async function symbolsInDBGet(req: Request, res: Response): Promise<any>{
  const resp = await symbolsInDB()
  res.status(200).json(toCamelCase(resp))
}
export function symbolPost(req: Request, res: Response): void{
  const form = formidable({ multiples: false })
  form.parse(req, async (err, fields, files) =>
  {
    const resp = await setSymbol(fields, files)
    res.status(200).json(resp)
  })
}
export async function symbolDelete(req: Request, res: Response): Promise<any>{
  const resp = await deleteSymbol(req.query.id as string)
  res.status(200).json(toCamelCase(resp))
}
export async function symbolsGet(req: Request, res: Response): Promise<any>{
  const resp = await getSymbols()
  res.status(200).json(toCamelCase(resp))
}
export async function profilePost(req: Request, res: Response): Promise<any>{
  const resp = await setProfile(req.body as GameUser)
  res.status(200).json(toCamelCase(resp))
}
export async function spinGet(req: Request, res: Response): Promise<any>{
  const { 'dev-request': dev } = req.headers
  const resp = await slotService.spin.spin(req.query.deviceId as string, Number(req.query.multiplier), dev === 'true')
  res.status(200).json(resp)
}
export async function countriesGet(req: Request, res: Response): Promise<void>{
  const countries = await getCountries()
  res.status(200).json(countries)
}
export async function gameInitGet(req: Request, res: Response): Promise<any>{
  const initData = await slotService.gameInit.gameInit(req.query.deviceId as string)
  res.status(200).json(initData)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return initData
}
export async function walletGet(req: Request, res: Response): Promise<any>{
  const user = await getGameUserByDeviceId(String(req.query.deviceId))
  const resp = await walletService.getWallet(user)
  res.status(200).json(resp)
}
export async function loginDataGet(req: Request, res: Response): Promise<any>{
  const resp = await getLoginData(Number(req.query.userId))
  res.status(200).json(resp)
}
export async function purchaseTicketsGet(req: Request, res: Response): Promise<any>{
  const resp = await gameUserRepo.purchaseTickets(
    req.query.deviceId as string,
    Number(req.query.ticketAmount)
  )
  res.status(200).json(resp)
}
export async function rafflePost(req: Request, res: Response): Promise<void>{
  const resp = await postRaffle(req.fields, req.files)
  res.status(200).json(resp)
}
export async function raffleDelete(req: Request, res: Response): Promise<void>{
  if(typeof req.query?.id !== 'string') throw createHttpError(BAD_REQUEST, 'Raffle ID is required')
  const resp = await deleteRaffle(req.query.id)
  res.status(200).json(resp)
}
export async function rafflesPrizeDataGet(req: Request, res: Response): Promise<any>{
  const user = await getGameUserById(req.user.id)
  if(!user) throw createHttpError(BAD_REQUEST, 'User not found in rafflesPrizeDataGet')
  const resp = await raffleRepo.getRaffles(user, true)
  res.status(200).json(resp)
}
export async function rafflePurchaseHistoryGet(req: Request, res: Response): Promise<any>{
  const resp = await raffleRepo.getRafflePurchaseHistory(req.query.deviceId as string)
  res.status(200).json(resp)
}
export async function rafflePurchaseGet(req: Request, res: Response): Promise<any>{
  const resp = await raffleRepo.rafflePurchase(
    req.query.deviceId as string,
    Number(req.query.raffleId),
    Number(req.query.amount)
  )
  res.status(200).json(resp)
}
export async function prizeNotifiedPost(req: Request, res: Response): Promise<any>{
  await raffleRepo.prizeNotified(Number(req.query.raffleId as string))
  res.status(200).json({ status: 'ok' })

}
export async function prizesWinnersGet(req: Request, res: Response): Promise<any>{
  const resp: PrizeWinners[] = await getPrizes()
  res.status(200).json(resp)
}
export async function changeWinnersStatusForCrudPost(req: Request, res: Response): Promise<any>{
  const resp: PrizeWinners[] = await postWinnersStatusForCrud(req.body.items, req.body.state)
  res.status(200).json(resp)
}
export async function withTokenGet(req: Request, res: Response): Promise<any>{
  const loginToken = req.query.token as string
  const {decodedToken, error} = verifyToken(loginToken)
  if (!decodedToken || error)
    return res.status(401).send({ auth: false, message: 'The user in the token was not found in the db' })
  const { id } = decodedToken as User
  const user = await metaService.getUserById(id)
  if (!user)
    return res.status(401).send({ auth: false, message: 'The user in the token was not found in the db' })
  const token = getNewToken({ id: user.id, deviceId: undefined })
  res.setHeader('token', token)
  const retUser = { name: user.name, email: user.email, id: user.id, isDev: user.isDev }
  res.status(200).json({ user: retUser })
  return undefined
}
export async function authPost(req: Request, res: Response): Promise<any>{
  try
  {
    const user = await metaService.auth(req.body)
    if (!user) throw createHttpError(createHttpError.BadRequest, 'Email and/or Password not found')
    // const user = rows.length > 0 ? rows[0] : undefined
    // if (!user) {
    //   return res.status(401).send({auth: false, message: 'Error de credenciales, revise los datos'})
    // }
    const token = getNewToken({ id: user.id, deviceId: undefined })
    res.setHeader('token', token)
    res.status(200).json(user)
  } catch (error)
  {
    res.status(500).json(error)
  }
}
export async function languageCodeGet(req: Request, res: Response): Promise<any>{
  const resp = await setLanguageCode(req.user.id, req.query.languageCode as string)
  res.status(200).json(resp)
}
export async function soportePost(req: Request, res: Response): Promise<any>{
  const resp = await setSoporte(req.user.id, req.body)
  res.status(200).json(resp)
}
export async function eventsForCrudGet(req: Request, res: Response): Promise<any>{
  const resp = await getEventsForCrud()
  res.status(200).json(resp)
}
export async function eventsForCrudPost(req: Request, res: Response): Promise<any>{
  const resp = await getEventsForCrud()
  res.status(200).json(resp)
}
export async function adsSettingsForCrudGet(req: Request, res: Response): Promise<any>{
  const resp = await getAdsSettingsForCrud()
  res.status(200).json(resp)
}
export async function adsSettingsForCrudPost(req: Request, res: Response): Promise<any>{
  const resp = await postAdsSettingsForCrud(req.body.interstitialsRatio)
  res.status(200).json(resp)
}
export async function videoAdsViewCountForCrudGet(req: Request, res: Response): Promise<any>{
  const resp = await getVideoAdsViewCountForCrud(Number(req.query.userId))
  res.status(200).json(resp)
}
export async function winnersForCrudGet(req: Request, res: Response): Promise<any>{
  const resp = await getWinnersForCrud()
  res.status(200).json(resp)
}
export async function ticketsSettingsForCrudGet(req: Request, res: Response): Promise<any>{
  const resp = await getTicketsSettingsForCrud()
  res.status(200).json(resp)
}
export async function ticketsSettingsForCrudPost(req: Request, res: Response): Promise<any>{
  const resp = await postTicketsSettingsForCrud(req.body)
  res.status(200).json(resp)
}
export async function supportRequestForCrudGet(req: Request, res: Response): Promise<any>{
  const resp = await getSupportRequestForCrud(req.query.userId as string)
  res.status(200).json(resp)
}
export async function skinsGet(req: Request, res: Response): Promise<any>{
  const resp = await getSkinsForCrud()
  res.status(200).json(resp)
}
export async function eventPost(req: Request, res: Response): Promise<void>{
    const resp = await setEvent(req.fields, req.files)
    res.status(200).json(resp)
}
export function eventDelete(req: Request, res: Response): void{
    const resp = deleteEvent(Number(req.query.id))
    res.status(200).json(resp)
}
export async function eventsReloadPost(req: Request, res: Response): Promise<any>{
  await reloadRulesFromDb()
  res.status(200).json({ status: 'ok' })
}
export async function spinDataGet(req: Request, res: Response): Promise<any>{
  const spinData = await getJackpotData()
  res.status(200).json(spinData)
}
export function allEvents(req: Request, res: Response): any{
  const resp = getAllEvents()
  res.status(200).json(resp)
}
export async function spinDataPost(req: Request, res: Response): Promise<any>{
  const resp = await jackpotPost(req.body)
  res.status(200).json(resp)
}
export async function dailyRewardInfoGet(req: Request, res: Response): Promise<any>{
  await dailyRewardInfo(req.query.deviceId as string)
  res.status(200).json(1)
}
export async function dailyRewardGet(req: Request, res: Response): Promise<any>{
  const rewards = await getDailyRewardPrizesForCrud()
  res.status(200).json(rewards)
}
export async function dailyRewardPost(req: Request, res: Response): Promise<any>{
  const rewards = await setDailyRewardPrize(req.body)
  res.status(200).json(rewards)
}
export async function dailyRewardDelete(req: Request, res: Response): Promise<any>{
  const rewards = await deleteDailyRewardPrize(Number(req.query.id))
  res.status(200).json(rewards)
}
export async function spinSettingsForCrudGet(req: Request, res: Response): Promise<any>{
  const value = await getSpinSettingsForCrud()
  res.status(200).json(value)
}
export async function spinSettingsForCrudPost(req: Request, res: Response): Promise<any>{
  await setSpinSettingsForCrud(req.body)
  res.status(200).json(1)
}
export async function dailyRewardClaimGet(req: Request, res: Response): Promise<any>{
  const resp = await dailyRewardClaim(req.query.deviceId as string)
  res.status(200).json(resp)
}
export function postmanGet(req: Request, res: Response): any{
  res.status(200).json(req.body)
}
export async function rafflesForCrudGet(req: Request, res: Response): Promise<any>{
  const data = await getRafflesForCrud()
  res.status(200).json(data)
}
export async function tombolaForCrudGet(req: Request, res: Response): Promise<any>{
  const data = await getTombolaForCrud()
  res.status(200).json(data)
}
export async function tombolaForCrudPost(req: Request, res: Response): Promise<any>{
  const data = await postTombolaForCrud(req.body)
  res.status(200).json(data)
}
export async function winLoseForTombolaCrudPost(req: Request, res: Response): Promise<any>{
  await postWinLoseForTombolaCrudPost(req.body.lose)
  res.status(200).json({status: 'ok'})
}
export async function skinsForCrudGet(req: Request, res: Response): Promise<any>{
  const data = await getSkinsForCrud()
  res.status(200).json(data)
}
export async function skinForCrudPost(req: Request, res: Response): Promise<any>{
  const data = await postSkinForCrud(req.fields, req.files)
  res.status(200).json(data)
}
export async function skinForCrudDelete(req: Request, res: Response): Promise<any>{
  const data = await deleteSkinForCrud(req.query.skinId as string)
  res.status(200).json(data)
}
export async function languagesForCrudGet(req: Request, res: Response): Promise<any>{
  const data = await getLanguagesForCrud()
  res.status(200).json(data)
}
export async function supportAdminForCrudPost(req: Request, res: Response): Promise<any>{
  const data = await postSupportAdminForCrud(req.body)
  res.status(200).json(data)
}
export async function supportAdminForCrudGet(req: Request, res: Response): Promise<any>{
  const data = await supportAdminForCrud()
  res.status(200).json(data)
}
export async function legalsForCrudGet(req: Request, res: Response): Promise<any>{
  const data = await getLegalsForCrud()
  res.status(200).json(data)
}
export async function legalsGet(req: Request, res: Response): Promise<any>{
  const data = await getLegals(req.query.deviceId as string)
  res.status(200).json(data)
}
export async function legalsForCrudPost(req: Request, res: Response): Promise<any>{
  const data = await postLegalsForCrud(req.body.items, req.body.dontEnforce as boolean)
  res.status(200).json(data)
}
export async function languageForCrudToggleDelete(req: Request, res: Response): Promise<any>{
  const remove = req.query.remove === 'true'
  console.log('requ.queary', req.query)
  let data
  if(remove)
    data = await deleteLanguageForCrud(req.query.languageId as string)
  else
    data = await toggleDeleteLanguageForCrud(req.query.languageId as string)
  res.status(200).json(data)
}
export async function languageForCrudPost(req: Request, res: Response): Promise<any>{
  const data = await postLanguageForCrud(req.fields, req.files)
  res.status(200).json(data)
}
export async function countriesForCrudPost(req: Request, res: Response): Promise<any>{
  const data = await postCountryForCrud(req.fields, req.files)
  res.status(200).json(data)
}
export async function countriesForCrudGet(req: Request, res: Response): Promise<any>{
  const data = await getCountriesForCrud()
  res.status(200).json(data)
}
export async function miscSettingsForCrudGet(req: Request, res: Response): Promise<any>{
  const data = await getMiscSettingsForCrud()
  res.status(200).json(data)
}
export async function miscSettingsForCrudPost(req: Request, res: Response): Promise<any>{
  const data = await postMiscSettingsForCrud(req.body)
  res.status(200).json(data)
}
export async function settingsForLocalizationPost(req: Request, res: Response): Promise<any>{
  const data = await postSettingsForLocalization(req.body)
  res.status(200).json(data)
}
export async function testRegSpinsUSer39(req: Request, res: Response): Promise<any>{
  await testUser39(Number(req.query.spins))
  res.status(200).json({status: 'ok'})
}
export async function ironsource(req: Request, res: Response): Promise<any>{
  const { 'dev-request': dev } = req.headers
  const addressParts = (req.connection.remoteAddress as string).split(':')
  let ipAddr
  if(addressParts.length >= 4)
    ipAddr = addressParts[3]
  const resp = await callback(req.query as {
    USER_ID: 'string';
    EVENT_ID: 'string';
    rewards: 'string';
    currency: 'string';
    DELIVERY_TYPE: 'string';
    AD_PROVIDER: 'string';
    publisherSubId: 'string';
    timestamp: 'string';
    signature: 'string';
    country: 'string';
    negativeCallback: 'string';
  }, ipAddr, dev === 'true')
  res.status(200).send(resp)
}
export async function appodeal(req: Request, res: Response): Promise<void>{
  // const { 'dev-request': dev } = req.headers
  let resp
  console.log('req.query.dev', req.query.dev)
  if (req.query.dev === 'true') {
    console.log('ok')
    resp = await appodealCallbackPlain(req.body as QueryParams)
  } else
    {resp = await appodealCallback(<string> req.query.data1, <string> req.query.data2)}
  res.status(200).send(resp)
}
export async function tapjoy(req: Request, res: Response): Promise<void>{
  // const { 'dev-request': dev } = req.headers
  log.red.info('tapjoy', req.query)
  const isDev = req.query.dev === 'true'
  const resp = await tapjoyCallback(req.query as { id: string, snuid: string, currency: string, mac_address: string, verifier: string, paymentType: string  }, isDev)
  res.status(200).send(resp)
}
export async function atlasGet(req: Request, res: Response): Promise<any>{
  const resp = await getAtlas(<string> req.query.name)
  res.status(200).send(resp)
}
export async function slotDataGet(req: Request, res: Response): Promise<any>{
  const user = await getGameUserByDeviceId(req.query.deviceId as string)
  const resp = await getSlotData(user)
  res.status(200).send(resp)
}
export  function resetSettingsPost(req: Request, res: Response): void{
  resetSettings()
  res.status(200).send({status: 'ok'})
}
export async function iapGet(req: Request, res: Response): Promise<void>{
  let adsFree = '1'
  if (req.query.adsFree === '0' || req.query.adsFree === 'false')
    adsFree = '0'
  const user = await getGameUserByDeviceId(req.query.deviceId as string)
  await setIap(user, adsFree)
  res.status(200).send({status: 'ok'})
}
export async function localizationsForCrudGet(req: Request, res: Response): Promise<void>{
  const localizations = await getLocalizations(req.query.item as string)
  res.status(200).send(localizations)
}
export async function localizationsForCrudPost(req: Request, res: Response): Promise<void>{
  const localizations = await postLocalizations(req.body.item)
  res.status(200).send(localizations)
}
export async function updateLocalizationJSONPost(req: Request, res: Response): Promise<void> {
  const resp = await updateLocalizationJSON(req.body.languageCode, req.body.environment)
  res.status(200).send(resp)
}
export async function localization(req: Request, res: Response): Promise<void> {
  const resp = await getLocalizationJSON(req.query.languageCode as string)
  res.status(200).send(resp)
}
export async function languageDefaultForCrudPost(req: Request, res: Response): Promise<void>{
  const localizations = await postLanguageDefaultForCrud(Number(req.body.id))
  res.status(200).send(localizations)
}
export async function sendmail(req: Request, res: Response): Promise<void>{
  const {to, subject, html} = req.body
  console.log('to, subject, html', to, subject, html)
  const sended = await sendMail(to, subject, html)
  console.log('sended', sended)
  res.status(200).send({status: 'ok'})
}
export async function cardsForFrontGet(req: Request, res: Response): Promise<void> {
  const cards = await getCardsForCrud()
  res.status(200).send(cards)
}
export async function cardSetsForFrontGet(req: Request, res: Response): Promise<void> {
  const cards = await getCardSetsForCrud()
  res.status(200).send(cards)
}
export async function cardSetsForFrontPost(req: Request, res: Response): Promise<void> {
  const cards = await postCardSetsForCrud(req.body)
  res.status(200).send(cards)
}