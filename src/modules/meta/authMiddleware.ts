/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { NextFunction, Request, Response } from 'express'
import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import { verifyToken } from '../../services/jwtService'
import { getSetting } from '../slot/slot.services/settings.service'
import { getGameUserByDeviceId, getUserById } from "./meta-services/meta.service"
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
  const { decodedToken, error } = verifyToken(sessionToken as string)

  if ((error || !decodedToken.id) && maintenanceMode)
    throw createHttpError(BAD_REQUEST, 'We are in maintenance, we\'ll be back up soon!')
  
  if (maintenanceMode) {
    let user: User | GameUser = await getGameUser(decodedToken.id)
    if (!user) {
      user = await getUserById(decodedToken.id)
      if(user) user.isDev = true
    }
    if(!user || (!isDev && !user.isDev))
      throw createHttpError(BAD_REQUEST, 'We are in maintenance, we\'ll be back up soon!')
  }
  return next()
}
export async function checkToken(req: Request, res: Response, next: NextFunction): Promise<any>
{
  const { 'dev-request': dev } = req.headers
  const isDev = (dev === 'true')
  if (isDev)
  {
    // console.log('have a dev-request')
    let { deviceId } = req.query
    if (!deviceId) deviceId = req.body?.deviceId
    if (!deviceId)
    {
      console.error(`missed deviceId in req.query in ${req.baseUrl}${req.route?.path}`)
      throw createHttpError(BAD_REQUEST, `deviceId parameter missing ${req.baseUrl}${req.route?.path}`)
    }
    const _user = await getGameUserByDeviceId(deviceId as string)
    if (!_user) throw createHttpError(BAD_REQUEST, 'There is not user registered with that deviceId')
    req.user = {
      deviceId: deviceId as string,
      id: _user.id
    }
    return next()
  }
  let { sessionToken } = req.query
  if (!sessionToken) sessionToken = req.body.sessionToken
  if (!sessionToken) sessionToken = req.headers.token
  const { decodedToken, error } = verifyToken(sessionToken as string)
  // console.log('settoken', decodedToken)

  if (error || !decodedToken.id)
  {
    const message = error ? error.message : 'no user foune in token'
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`checkToken: ${message}`, req.baseUrl, sessionToken)
    return res.status(401).send({ auth: false, message })
  }
  req.user = {
    id: decodedToken.id,
    deviceId: decodedToken.devicedID
  }
  return next()
}
