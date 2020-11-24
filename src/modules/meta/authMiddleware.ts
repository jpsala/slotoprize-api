/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { NextFunction, Request, Response } from 'express'
import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'
import { verifyToken } from '../../services/jwtService'
import { getGameUserByDeviceId, getUserById  } from "./meta-services/meta.service"
import { getGameUser } from './meta.repo/gameUser.repo'

export async function checkToken(req: Request, res: Response, next: NextFunction): Promise<any>
{
  let { deviceId } = req.query
  if (!deviceId) deviceId = req.body?.deviceId
  const { 'dev-request': dev } = req.headers
  const isDev = (dev === 'true')
  if (isDev)
  {
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
    const message = error ? error.message : 'No user found in token'
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`checkToken: ${message}`, req.baseUrl, sessionToken)
    return res.status(401).send({ auth: false, message })
  } else {
    const user  = await getGameUser(decodedToken.id)
    if (!user) {
      const normalUser = await getUserById(decodedToken.id)
      if(!normalUser) return res.status(401).send({ auth: false, message: 'User not found' })
    }
    if (user?.deviceId !== null) req.query.deviceId = user?.deviceId
    console.log('Auth:', `${user?.id}-${user?.deviceId}-${user?.lastName}`)
  }
  req.user = {id: decodedToken.id, deviceId: decodedToken.devicedID}
  return next()
}
