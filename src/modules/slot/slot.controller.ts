import { Request, Response } from 'express'
import createError from 'http-errors'
import toCamelCase from 'camelcase-keys'
import { verifyToken, getNewToken } from '../../services/jwtService'
import { GameUser, User, RafflePrizeDataDB } from "../meta/meta.types"
import * as metaRepo from '../meta/meta.repo'
import * as metaService from '../meta/meta-services'
import { setReqUser } from '../meta/authMiddleware'
import { setLanguageCode } from '../meta/meta.repo/gameUser.repo'
import { setSoporte } from '../meta/meta.repo/soporte.repo'
import { dailyRewardClaim } from './slot.repo/dailyReward.repo'
import * as slotService from './slot.services'
import * as walletService from "./slot.services/wallet.service"
// import {spin} from './slot.services/spin.service'
import { symbolsInDB } from './slot.services/symbol.service'
import { addEvent } from './slot.repo/event.repo'

export async function symbolsInDBGet(req: Request, res: Response): Promise<any>
{
  const resp = await symbolsInDB()
  res.status(200).json(toCamelCase(resp))
}
export async function profilePost(req: Request, res: Response): Promise<any>
{
  const resp = await slotService.profile.setProfile(req.body as GameUser)
  res.status(200).json(toCamelCase(resp))
}
export async function spinGet(req: Request, res: Response): Promise<any>
{
  const resp = await slotService.spin.spin(req.query.deviceId as string, Number(req.query.multiplier))
  res.status(200).json(resp)
}
export async function countriesGet(req: Request, res: Response): Promise<void>
{
  const countries = await metaRepo.countryRepo.getCountries()
  res.status(200).json(countries)
}
export async function gameInitGet(req: Request, res: Response): Promise<any>
{
  const initData = await slotService.gameInit.gameInit(req.query.deviceId as string)
  res.status(200).json(initData)
  return initData
}
export async function walletGet(req: Request, res: Response): Promise<any>
{
  const resp = await walletService.getWallet(req.query.deviceId as string)
  res.status(200).json(resp)
}
export async function purchaseTicketsGet(req: Request, res: Response): Promise<any>
{
  const resp = await walletService.purchaseTickets(
    req.query.deviceId as string,
    Number(req.query.ticketAmount)
  )
  res.status(200).json(resp)
}
// Raffles
export async function rafflePost(req: Request, res: Response): Promise<any>
{
  const resp = await metaRepo.raffleRepo.newRaffle(req.body as RafflePrizeDataDB)
  res.status(200).json(resp)
}
export async function rafflesPrizeDataGet(req: Request, res: Response): Promise<any>
{
  const resp = await metaRepo.raffleRepo.getRaffles()
  res.status(200).json(resp)
  return resp
}
export async function rafflePurchaseHistoryGet(req: Request, res: Response): Promise<any>
{
  const resp = await metaRepo.raffleRepo.getRafflePurchaseHistory(req.query.deviceId as string)
  res.status(200).json(resp)
}
export async function rafflePurchaseGet(req: Request, res: Response): Promise<any>
{
  const resp = await metaRepo.raffleRepo.rafflePurchase(
    req.query.deviceId as string,
    Number(req.query.raffleId),
    Number(req.query.amount)
  )
  res.status(200).json(resp)
}
export async function prizeNotifiedPost(req: Request, res: Response): Promise<any>
{
  await metaRepo.raffleRepo.prizeNotified(Number(req.query.raffleId as string))
  res.status(200).json({ status: 'ok' })

}
export async function raffleWinnersGet(req: Request, res: Response): Promise<any>
{
  const resp: string[] = await metaRepo.raffleRepo.getWinners()
  res.status(200).json(resp)
}
// End Raffles
export async function withTokenGet(req: Request, res: Response): Promise<any>
{
  console.log('req', req)
  const loginToken = req.query.token as string
  const statusToken = verifyToken(loginToken)
  console.log('st', statusToken.decodedToken.user)
  const { id } = statusToken.decodedToken.user as User
  console.log('id', id)
  const user = await metaService.miscService.getUserById(id)
  console.log('user', user)
  if (!user)
    return res.status(401).send({ auth: false, message: 'The user in the token was not found in the db' })

  const token = getNewToken({ user: { id: user.id, name: user.name } })
  res.setHeader('token', token)
  setReqUser(undefined, user.id)
  const retUser = { name: user.name, email: user.email, id: user.id }
  res.status(200).json({ user: retUser })
  return undefined
}
export async function authPos(req: Request, res: Response): Promise<any>
{
  try
  {
    const user = await metaService.miscService.auth(req.body)
    if (!user) throw createError(createError.BadRequest, 'Email and/or Password not found')
    // const user = rows.length > 0 ? rows[0] : undefined
    // if (!user) {
    //   return res.status(401).send({auth: false, message: 'Error de credenciales, revise los datos'})
    // }
    const token = getNewToken({ user: { id: user.id, name: user.name } })
    res.setHeader('token', token)
    // req.user = user
    res.status(200).json(user)
  } catch (error)
  {
    res.status(500).json(error)
  }
}
export function testSchedGet(req: Request, res: Response): any
{
  const resp = metaService.cronService.getPendingTasks()
  res.status(200).json(resp)
}
export async function languageCodeGet(req: Request, res: Response): Promise<any>
{
  const resp = await setLanguageCode(req.user.id, req.query.languageCode as string)
  res.status(200).json(resp)
}
export async function soportePost(req: Request, res: Response): Promise<any>
{
  const resp = await setSoporte(req.user.id, req.body)
  res.status(200).json(resp)
}
export async function eventPost(req: Request, res: Response): Promise<any>
{
  const resp = await addEvent(req.body)
  res.status(200).json(resp)
}
export async function dailyRewardClaimGet(req: Request, res: Response): Promise<any>
{
  const resp = await dailyRewardClaim(req.query.deviceId as string)
  res.status(200).json(resp)
}
export function postmanGet(req: Request, res: Response): any
{
  res.status(200).json(req.body)
}

