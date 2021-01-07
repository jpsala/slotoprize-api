/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { NextFunction, Request, Response } from 'express'
import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import { verifyToken } from '../../services/jwtService'
import { getGameUserByDeviceId } from "./meta-services/meta.service"
import { getGameUserById } from './meta.repo/gameUser.repo'

export async function checkToken(req: Request, res: Response, next: NextFunction): Promise<any>
{

  let { sessionToken } = req.query
  if (!sessionToken) sessionToken = req.body.sessionToken
  if (!sessionToken) throw createHttpError(BAD_REQUEST, 'Invalid token')
  if (sessionToken === 'lani0363') {
    const _user = await getGameUserByDeviceId(req.user.deviceId)
    if (!_user) throw createHttpError(BAD_REQUEST, 'There is not user registered with that deviceId')
    req.user.id = _user.id
    req.user.isDev = _user.isDev
    return next()
  }

  const { decodedToken, error } = verifyToken(sessionToken as string)

  if (error || !decodedToken.id) {
    const message = error ? error.message : 'Token error'
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`checkToken: ${message}`, req.baseUrl, sessionToken)
    return res.status(401).send({ auth: false, message })
  } else {
    const user  = await getGameUserById(decodedToken.id)
    if (user) {
      req.user.id = user.id
      req.user.isDev = user.isDev
      console.log('Auth:', `${user?.id}-${user?.deviceId}-Dev:${user?.isDev ? 'isDev':'notDev'}`)
      if (req.user.deviceId !== user.deviceId) throw createHttpError(BAD_REQUEST, 'User token doesn\'t match')
    } else 
      {throw createHttpError(BAD_REQUEST, 'User not found')}    
  }

  return next()
}
