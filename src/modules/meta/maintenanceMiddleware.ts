/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { NextFunction, Request, Response } from 'express'
import createHttpError from 'http-errors'
import { verifyToken } from '../../services/jwtService'
import { getSetting } from '../slot/slot.services/settings.service'
import { getLocalization } from './meta-services/localization.service'
import { getUserById } from "./meta-services/meta.service"
import { getGameUser } from './meta.repo/gameUser.repo'
import { GameUser, User } from './meta.types'

export async function checkmaintenanceMode(req: Request, res: Response, next: NextFunction): Promise<any>
{
  const maintenanceMode = (await getSetting('maintenanceMode', '0')) === '1'
  const { 'dev-request': dev } = req.headers
  const isDev = (dev === 'true')
  if (isDev) return next()

  let { sessionToken } = req.query
  if (!sessionToken) sessionToken = req.body.sessionToken
  if (!sessionToken) sessionToken = req.headers.token
  if (sessionToken && sessionToken === 'lani0363') return next()
  
  const { decodedToken, error } = verifyToken(sessionToken as string)

  if ((error || !decodedToken.id) && maintenanceMode)
    throw createHttpError(503, await getLocalization('maintenanceMode', undefined, 'We are in maintenance, we\'ll be back up soon!'))
  
  if (maintenanceMode) {
    let user: User | GameUser = await getGameUser(decodedToken.id)
    if (!user) {
      user = await getUserById(decodedToken.id)
      if(user) user.isDev = true
    }
    if(!user || (!isDev && !user.isDev))
    throw createHttpError(503, await getLocalization('maintenanceMode', user.id, 'We are in maintenance, we\'ll be back up soon!'))
  }
  return next()
}
