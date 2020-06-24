import {Request, Response} from 'express'
import * as httpStatusCodes from "http-status-codes"
import createError from 'http-errors'
import toCamelCase from 'camelcase-keys'

import {getNewToken} from '../../services/jwtService'
import * as metaService from '../meta/meta.service'

import * as slotService from './slot.service'

export async function getProfile(req: Request, res: Response): Promise<any> {
  const resp = await slotService.getProfile(req.query.deviceId as string)
  res.status(httpStatusCodes.OK).json(toCamelCase(resp))
}

export async function postProfile(req: Request, res: Response): Promise<any> {
  console.log('rq', req.query)
  const resp = await slotService.setProfile(req.query.deviceId as string, req.body)
  res.status(httpStatusCodes.OK).json({profileData: toCamelCase(resp)})
}

export async function spin(req: Request, res: Response): Promise<any> {
  const resp = await slotService.spin(req.query.deviceId as string, req.query.bet as string)
  res.status(httpStatusCodes.OK).json(resp)
}
export async function gameInit(req: Request, res: Response): Promise<any> {
  try {
    const deviceId = req.query.deviceId as string
    const rawUser = await metaService.getOrSetUserByDeviceId(deviceId as string)
    const wallet = await slotService.getOrSetWallet(deviceId, rawUser.id)
    console.log('wallet', wallet)
    // @URGENT crear savelogin
    // await metaService.saveLogin(rawUser.id, 'SlotoPrizes', deviceId)
    // const rawUser = {id: 1, first_name: 'first', last_name: 'last', email: 'email'}
    const token = getNewToken({id: 1, deviceId: 1})
    const user = {firsName: rawUser.first_name, lastNAme: rawUser.last_name, email: rawUser.email}
    const resp = await slotService.gameInit()
    const initData = {
      sessionId: token,
      profileData: toCamelCase(user),
      reelsData: resp.reelsData,
      walletData: wallet,
    }
    return res.status(httpStatusCodes.OK).json(initData)
  } catch (error) {
    throw createError(httpStatusCodes.INTERNAL_SERVER_ERROR, error)
  }
}
export async function getWallet(req: Request, res: Response): Promise<any> {
  const resp = await slotService.getWallet(req.query.deviceId as string)
  res.status(httpStatusCodes.OK).json(resp)
}
export async function purchaseTickets(req: Request, res: Response): Promise<any> {
  const resp = await slotService.purchaseTickets(
    req.query.deviceId as string,
    Number(req.query.ticketAmount) as number
  )
  res.status(httpStatusCodes.OK).json(resp)
}
