import { BAD_REQUEST } from 'http-status-codes'
import formidable from 'formidable'
import createError from 'http-errors'
import toCamelCase from 'camelcase-keys'
import { verifyToken, getNewToken } from '../../services/jwtService'
import { GameUser, User } from "../meta/meta.types"
import * as raffleRepo from '../meta/meta.repo/raffle.repo'
import * as metaService from '../meta/meta-services'
import { setReqUser } from '../meta/authMiddleware'
import { setLanguageCode , getPlayersForFront, getLoginData , getPlayerForFront, getGameUser , purchaseTickets } from '../meta/meta.repo/gameUser.repo'
import { setSoporte, getSupportRequestForCrud, supportAdminForCrud, postSupportAdminForCrud } from '../meta/meta.repo/support.repo'
import { getRafflesForCrud, postRaffle, deleteRaffle } from '../meta/meta.repo/raffle.repo'

import { getLanguagesForCrud, postLanguageForCrud, deleteLanguageForCrud } from '../meta/meta.repo/language.repo'
import { getCountriesForCrud, postCountryForCrud, getCountries } from '../meta/meta.repo/country.repo'

import { gameUserRepo } from '../meta/meta.repo'
import { getGameUserByDeviceId } from './../meta/meta-services/meta.service'
import { setProfile } from './slot.services/profile.service'
import { getJackpotData, addJackpotNextRow } from './slot.services/jackpot.service'
import { getTombolaForCrud, postTombolaForCrud } from './slot.services/tombola.service'

import { getSkinsForCrud, postSkinForCrud, deleteSkinForCrud } from './slot.repo/skin.repo'
import { updateRulesFromDb } from './slot.services/events/events'
import { dailyRewardClaim } from './slot.repo/dailyReward.repo'
import * as slotService from './slot.services'
import * as walletService from "./slot.services/wallet.service"
// import {spin} from './slot.services/spin.service'
import { symbolsInDB, getSymbols, setSymbol, deleteSymbol } from './slot.services/symbol.service'
import { setEvent, getEventsForCrud } from './slot.repo/event.repo'
import { Request, Response } from 'express'
import { userChanged, testUser39 } from './slot.repo/spin.regeneration.repo'

export async function playerForFrontGet(req: Request, res: Response): Promise<any>{
  console.log('req', req)
  const resp = await getPlayerForFront(String(req.query.id))
  res.status(200).json(resp)
}
export async function playersForFrontGet(req: Request, res: Response): Promise<any>{
  const resp = await getPlayersForFront(Number(req.query.from), Number(req.query.limit), String(req.query.filter))
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
  const resp = await slotService.spin.spin(req.query.deviceId as string, Number(req.query.multiplier))
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
export async function rafflePost(req: Request, res: Response): Promise<void>
{
  const resp = await postRaffle(req.fields, req.files)
  res.status(200).json(resp)
}
export async function raffleDelete(req: Request, res: Response): Promise<void>{
  if(typeof req.query?.id !== 'string') throw createError(BAD_REQUEST, 'Raffle ID is required')
  const resp = await deleteRaffle(req.query.id)
  res.status(200).json(resp)
}
export async function rafflesPrizeDataGet(req: Request, res: Response): Promise<any>
{
  const user = await getGameUser(req.user.id)
  const resp = await raffleRepo.getRaffles(user)
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
export async function raffleWinnersGet(req: Request, res: Response): Promise<any>{
  const resp: string[] = await raffleRepo.getWinners()
  res.status(200).json(resp)
}
export async function withTokenGet(req: Request, res: Response): Promise<any>{
  const loginToken = req.query.token as string
  const statusToken = verifyToken(loginToken)
  const { id } = statusToken.decodedToken as User
  const user = await metaService.getUserById(id)
  if (!user)
    return res.status(401).send({ auth: false, message: 'The user in the token was not found in the db' })
  const token = getNewToken({ id: user.id, deviceId: undefined })
  res.setHeader('token', token)
  setReqUser(undefined, user.id)
  const retUser = { name: user.name, email: user.email, id: user.id }
  res.status(200).json({ user: retUser })
  return undefined
}
export async function authPost(req: Request, res: Response): Promise<any>{
  try
  {
    const user = await metaService.auth(req.body)
    if (!user) throw createError(createError.BadRequest, 'Email and/or Password not found')
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
export async function supportRequestForCrudGet(req: Request, res: Response): Promise<any>{
  const resp = await getSupportRequestForCrud(req.query.userId as string)
  res.status(200).json(resp)
}
export async function skinsGet(req: Request, res: Response): Promise<any>{
  const resp = await getSkinsForCrud()
  res.status(200).json(resp)
}
export async function eventPost(req: Request, res: Response): Promise<void>{
    console.log('req.fields, req.files', req.fields, req.files)
    const resp = await setEvent(req.fields, req.files)
    res.status(200).json(resp)
}
export async function eventsReloadPost(req: Request, res: Response): Promise<any>{
  await updateRulesFromDb()
  res.status(200).json({ status: 'ok' })
}
export async function spinDataGet(req: Request, res: Response): Promise<any>{
  const spinData = await getJackpotData()
  res.status(200).json(spinData)
}
export async function spinDataPost(req: Request, res: Response): Promise<any>{
  await addJackpotNextRow(req.body)
  res.status(200).json({status: 'ok'})
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
export async function languageForCrudDelete(req: Request, res: Response): Promise<any>{
  const data = await deleteLanguageForCrud(req.query.languageId as string)
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
export async function testRegSpinsUSer39(req: Request, res: Response): Promise<any>{
  await testUser39(Number(req.query.spins))
  res.status(200).json({status: 'ok'})
}