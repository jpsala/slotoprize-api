/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { NextFunction, Request, Response } from 'express'
import createHttpError from 'http-errors'
import { getSetting } from '../slot/slot.services/settings.service'
import { getLocalization } from './meta-services/localization.service'
import { getGameUserByDeviceId } from './meta.repo/gameUser.repo'

export async function checkmaintenanceMode(req: Request, res: Response, next: NextFunction): Promise<any> {
  const routeIsGameInit = req.route.path === '/game_init'
  if(routeIsGameInit){
    const _user = await getGameUserByDeviceId(req.user.deviceId)
    if(_user.isDev) return next()
  }
  const maintenanceMode = (await getSetting('maintenanceMode', '0')) === '1'
  if (!maintenanceMode) return next()
  
  if (req.user.isDev) return next()
  throw createHttpError(503, await getLocalization('maintenanceMode', req.user.id, 'We are in maintenance, we\'ll be back up soon!'))
}
