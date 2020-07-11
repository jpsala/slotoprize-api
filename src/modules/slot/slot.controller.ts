import {Request, Response} from 'express'
import createError from 'http-errors'
import toCamelCase from 'camelcase-keys'
import {verifyToken, getNewToken} from '../../services/jwtService'
import {GameUser, User, RafflePrizeDataDB} from "../meta/meta.types"

import * as metaService from '../meta/meta.service'
import {getCountries as metaGetCountries} from '../meta/meta.repo/country.repo'
import {raffleRepo} from '../meta/meta.repo'
import {getPendingTasks} from '../meta/meta-services/cron'
import {gameInit} from './slot.services/game-init.service'
import {setProfile} from './slot.services/profile.service'

// import * as types from '../meta/meta.types'
import * as walletService from "./slot.services/wallet.service"
import {spin} from './slot.services/spin.service'
import {symbolsInDB} from './slot.services/symbol.service'

export async function symbolsInDBGet(req: Request, res: Response): Promise<any> {
  const resp = await symbolsInDB()
  res.status(200).json(toCamelCase(resp))
}
export async function profileGet(req: Request, res: Response): Promise<any> {
  const resp = await (req.query.deviceId as string, ['first_name', 'last_name', 'email'])
  res.status(200).json(toCamelCase(resp))
}
export async function profilePost(req: Request, res: Response): Promise<any> {
  const resp = await setProfile(req.body as GameUser)
  res.status(200).json(toCamelCase(resp))
}
export async function spinGet(req: Request, res: Response): Promise<any> {
  const resp = await spin(req.query.deviceId as string, Number(req.query.multiplier))
  res.status(200).json(resp)
}
export async function countriesGet(req: Request, res: Response): Promise<void> {
  const countries = await metaGetCountries()
  res.status(200).json(countries)
}
export async function gameInitGet(req: Request, res: Response): Promise<any> {
  const initData = await gameInit(req.query.deviceId as string)
  res.status(200).json(initData)
  return initData
}
export async function walletGet(req: Request, res: Response): Promise<any> {
  const resp = await walletService.getWallet(req.query.deviceId as string)
  res.status(200).json(resp)
}
export async function purchaseTicketsGet(req: Request, res: Response): Promise<any> {
  const resp = await walletService.purchaseTickets(
    req.query.deviceId as string,
    Number(req.query.ticketAmount) as number
  )
  res.status(200).json(resp)
}
// Raffles
export async function rafflePost(req: Request, res: Response): Promise<any> {
  const resp = await raffleRepo.newRaffle(req.body as RafflePrizeDataDB)
  res.status(200).json(resp)
}
export async function rafflesPrizeDataGet(req: Request, res: Response): Promise<any> {
  const resp = await raffleRepo.getRaffles(['id'])
  res.status(200).json(resp)
  return resp
}
export async function rafflePurchaseHistoryGet(req: Request, res: Response): Promise<any> {
  const resp = await raffleRepo.getRafflePurchaseHistory(req.query.deviceId as string)
  res.status(200).json(resp)
}
export async function rafflePurchaseGet(req: Request, res: Response): Promise<any> {
  const resp = await raffleRepo.rafflePurchase(
    req.query.deviceId as string,
    Number(req.query.raffleId),
    Number(req.query.amount)
  )
  res.status(200).json(resp)
}
export async function prizeNotifiedPost(req: Request, res: Response): Promise<any> {
  await raffleRepo.prizeNotified(Number(req.query.raffleId as string))
  res.status(200).json({status: 'ok'})

}
export async function raffleWinnersGet(req: Request, res: Response): Promise<any> {
  const resp: string[] = await raffleRepo.getWinners()
  console.log('resp', resp)
  res.status(200).json(resp)
}
// End Raffles
export async function withTokenGet(req: Request, res: Response): Promise<any> {
  console.log('req', req)
  const loginToken = req.query.token as string
  const statusToken = verifyToken(loginToken)
  console.log('st', statusToken.decodedToken.user)
  const {id} = statusToken.decodedToken.user as User
  console.log('id', id)
  const user = await metaService.getUserById(id)
  console.log('user', user)
  if (!user)
    return res.status(401).send({auth: false, message: 'The user in the token was not found in the db'})

  const token = getNewToken({user: {id: user.id, name: user.name}})
  res.setHeader('token', token)
  req.user = user
  const retUser = {name: user.name, email: user.email, id: user.id}
  res.status(200).json({user: retUser})
  return undefined
}
export async function authPos(req: Request, res: Response): Promise<any> {
  try {
    const user = await metaService.auth(req.body)
    if (!user) throw createError(createError.BadRequest, 'Email and/or Password not found')
    // const user = rows.length > 0 ? rows[0] : undefined
    // if (!user) {
    //   return res.status(401).send({auth: false, message: 'Error de credenciales, revise los datos'})
    // }
    const token = getNewToken({user: {id: user.id, name: user.name}})
    res.setHeader('token', token)
    // req.user = user
    res.status(200).json(user)
  } catch (error) {
    res.status(500).json(error)
  }
}
export function testSchedGet(req: Request, res: Response): any {
  const resp = getPendingTasks()
  res.status(200).json(resp)
}
export function postmanGet(req: Request, res: Response):any {
  res.status(200).json(req.body)
}
