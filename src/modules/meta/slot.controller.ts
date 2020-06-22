/* eslint-disable babel/camelcase */
import {NextFunction, Request, Response} from 'express'
import * as HttpStatus from 'http-status-codes'
import createError from 'http-errors'
import toCamelCase from 'camelcase-keys'

import {getNewToken} from '../../services/jwtService'
import * as slotService from '../slot/slot.service'

export async function gameInit(req: Request, res: Response): Promise<any> {
  try {
    const {deviceId} = req.query
    // const rawUser = await slotService.getOrSetUserByDeviceId(deviceId)
    // await slotService.saveLogin(rawUser.id, 'SlotoPrizes', deviceId)
    const rawUser = {id: 1, first_name: 'first', last_name: 'last', email: 'email'}
    const token = getNewToken({id: 1, deviceId})
    const user = {firsName: rawUser.first_name, lastNAme: rawUser.last_name, email: rawUser.email}
    const resp = await slotService.gameInit()
    const initData = {
      sessionId: token,
      profileData: toCamelCase(user),
      reelsData: resp.reelsData,
      walletData: {
        coins: 10,
        tickers: 3,
      },
    }
    return res.status(200).json(initData)
  } catch (error) {
    console.dir(error)
    throw createError(500, error)
  }
}
