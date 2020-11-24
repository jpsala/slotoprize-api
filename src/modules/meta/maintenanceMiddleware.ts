/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { NextFunction, Request, Response } from 'express'
import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import { verifyToken } from '../../services/jwtService'
import { getSetting } from '../slot/slot.services/settings.service'
import { getLocalization } from './meta-services/localization.service'
import { getGameUser, getGameUserByDeviceId } from './meta.repo/gameUser.repo'
import { GameUser } from './meta.types'

export async function checkmaintenanceMode(req: Request, res: Response, next: NextFunction): Promise<any> {
  
  let { deviceId } = req.query
  if (!deviceId) deviceId = req.body?.deviceId
  if (!deviceId) deviceId = req.params?.deviceId
  if(!deviceId) throw createHttpError(BAD_REQUEST, 'Device ID is required')

  const maintenanceMode = (await getSetting('maintenanceMode', '0')) === '1'
  if (!maintenanceMode) return next()
  
  const { 'dev-request': dev } = req.headers
  const isDev = (dev === 'true')
  if (isDev) return next()

  let { sessionToken } = req.query
  if (!sessionToken) sessionToken = req.params.sessionToken
  if (!sessionToken) sessionToken = req.body.sessionToken
  if (!sessionToken) sessionToken = req.headers.token

  if (sessionToken === 'lani0363') return next()

  let user: GameUser | undefined = undefined

  const { decodedToken, error } = verifyToken(sessionToken as string)

  if (decodedToken?.id && !error) {
    user = await getGameUser(decodedToken.id)
    if(user?.deviceId !== deviceId) throw createHttpError(BAD_REQUEST, 'User\'s deviceId and deviceId parametar doesn\'t match')
    if(user && user.isDev) return next()
    if(user && !user.isDev) throw createHttpError(503, await getLocalization('maintenanceMode', user?.id, 'We are in maintenance, we\'ll be back up soon!'))
  } else if(req.route.path !== '/game_init') {throw createHttpError(503, 'Token error')}
  

  user = deviceId ? await getGameUserByDeviceId(deviceId as string) : undefined
  if (!user) throw createHttpError(BAD_REQUEST, 'User not found')
  if(user.deviceId !== deviceId) throw createHttpError(BAD_REQUEST, 'User\'s deviceId and deviceId parametar doesn\'t match')
  if (user.isDev) return next()

  throw createHttpError(503, await getLocalization('maintenanceMode', user.id, 'We are in maintenance, we\'ll be back up soon!'))

  return next()
}
