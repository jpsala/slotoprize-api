/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { NextFunction, Request, Response } from 'express'
import createHttpError from 'http-errors'
import { getSetting } from '../slot/slot.services/settings.service'
import { getLocalization } from './meta-services/localization.service'

export async function checkmaintenanceMode(req: Request, res: Response, next: NextFunction): Promise<any> {

  const maintenanceMode = (await getSetting('maintenanceMode', '0')) === '1'
  if (!maintenanceMode) return next()
  
  if (req.user.isDev) return next()

  throw createHttpError(503, await getLocalization('maintenanceMode', req.user.id, 'We are in maintenance, we\'ll be back up soon!'))
}
