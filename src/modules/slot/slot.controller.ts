/* eslint-disable max-statements-per-line */
import {Request, Response} from 'express'
import * as httpStatusCodes from "http-status-codes"
import createError from 'http-errors'
import toCamelCase from 'camelcase-keys'
import {verifyToken, getNewToken} from '../../services/jwtService'
import {GameUser, User} from "../meta/meta.types"

import * as metaService from '../meta/meta.service'
import {settingGet} from './slot.services/settings.service'
// import * as types from '../meta/meta.types'
import * as slotService from './slot.service'
import * as walletService from "./slot.services/wallet.service"
import {getPayTable} from './slot.services/spin.service'

export async function symbolsInDB(req: Request, res: Response): Promise<any> {
  const resp = await slotService.symbolsInDB()
  res.status(httpStatusCodes.OK).json(toCamelCase(resp))
}
export async function getProfile(req: Request, res: Response): Promise<any> {
  const resp = await slotService.getProfile(req.query.deviceId as string)
  res.status(httpStatusCodes.OK).json(toCamelCase(resp))
}
export async function postProfile(req: Request, res: Response): Promise<any> {
  const resp = await slotService.setProfile(req.body as GameUser)
  res.status(httpStatusCodes.OK).json({profileData: toCamelCase(resp)})
}
export async function spin(req: Request, res: Response): Promise<any> {
  const resp = await slotService.spin(req.query.deviceId as string, req.query.multiplier as string)
  res.status(httpStatusCodes.OK).json(resp)
}
export async function gameInit(req: Request, res: Response): Promise<any> {
  try {
    const deviceId = req.query.deviceId as string
    const rawUser = await metaService.getOrSetGameUserByDeviceId(deviceId as string)
    const wallet = await walletService.getOrSetWallet(deviceId, rawUser.id)
    const payTable = await getPayTable()
    const betPrice = Number(await settingGet('spinCost', '1'))
    const maxMultiplier = Number(await settingGet('maxMultiplier', '3'))
    // @URGENT crear savelogin
    // await metaService.saveLogin(rawUser.id, 'SlotoPrizes', deviceId)
    // const rawUser = {id: 1, first_name: 'first', last_name: 'last', email: 'email'}
    const token = getNewToken({id: rawUser.id, deviceId})
    const user = {firsName: rawUser.first_name, lastNAme: rawUser.last_name, email: rawUser.email, isNew: rawUser.isNew}
    const resp = await slotService.gameInit()
    resp.reelsData.forEach((reel) => {
      reel.symbolsData.forEach((reelSymbol) => {
        const symbolPays: any[] = []
        payTable.filter((payTableSymbol) =>
          payTableSymbol.payment_type === reelSymbol.paymentType)
          .forEach((_symbol) => symbolPays.push(_symbol))
        const symbolAllPays: any[] = []
        for (let index = 1; index < 4; index++) {
          const row = symbolPays.find((_symbol) => _symbol.symbol_amount === index)
          if (row) { symbolAllPays.push(row.points) } else { symbolAllPays.push(0) }
        }
        reelSymbol.pays = symbolAllPays
      })
    })
    const initData = {
      sessionId: token,
      profileData: toCamelCase(user),
      betPrice,
      maxMultiplier,
      reelsData: resp.reelsData,
      walletData: wallet,
    }
    return res.status(httpStatusCodes.OK).json(initData)
  } catch (error) {
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, error)
  }
}
export async function getWallet(req: Request, res: Response): Promise<any> {
  const resp = await walletService.getWallet(req.query.deviceId as string)
  res.status(httpStatusCodes.OK).json(resp)
}
export async function purchaseTickets(req: Request, res: Response): Promise<any> {
  const resp = await walletService.purchaseTickets(
    req.query.deviceId as string,
    Number(req.query.ticketAmount) as number
  )
  res.status(httpStatusCodes.OK).json(resp)
}
export async function withToken(req: Request, res: Response): Promise<any> {
  console.log('req', req)
  const loginToken = req.query.token as string
  const statusToken = verifyToken(loginToken)
  console.log('st', statusToken.decodedToken.user)
  const {id} = statusToken.decodedToken.user as User
  console.log('id', id)
  const user = await metaService.getUserById(id)
  console.log('user', user)
  if (!user) {
    return res.status(401).send({auth: false, message: 'The user in the token was not found in the db'})
  }
  const token = getNewToken({user: {id: user.id, name: user.name}})
  res.setHeader('token', token)
  // eslint-disable-next-line require-atomic-updates
  req.user = user
  const retUser = {name: user.name, email: user.email, id: user.id}
  res.status(200).json({user: retUser})
  return undefined
}
export async function auth(req: Request, res: Response): Promise<any> {
  try {
    const user = await metaService.auth(req.body)
    if (!user) { throw createError(httpStatusCodes.BAD_REQUEST, 'Email and/or Password not found') }
    // const user = rows.length > 0 ? rows[0] : undefined
    // if (!user) {
    //   return res.status(401).send({auth: false, message: 'Error de credenciales, revise los datos'})
    // }
    const token = getNewToken({user: {id: user.id, name: user.name}})
    res.setHeader('token', token)
    // req.user = user
    res.status(httpStatusCodes.OK).json(user)
  } catch (error) {
    res.status(500).json(error)
  }
}
export function postman(req: Request, res: Response):any {
  res.status(httpStatusCodes.OK).json(req.body)
}
