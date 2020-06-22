/* eslint-disable require-atomic-updates */
import {NextFunction, Request, Response} from 'express'
import createError from 'http-errors'

import {verifyToken} from '../../services/jwtService'
import {getUserByDeviceId} from '../meta/meta.service'

export async function checkToken(req: Request, res: Response, next: NextFunction):Promise<any> {
  const {'dev-request': dev} = req.headers
  const isDev = (dev === 'true')
  // const dev = req.headers['Dev-Request'];
  console.log('dev', isDev)
  if (isDev) {
    const {deviceId} = req.query
    if (!deviceId) {
      console.error(`falta deviceId in req.query in ${req.baseUrl}${req.route.path}`)
      throw createError(400, `deviceId parameter missing ${req.baseUrl}${req.route.path}`)
    }
    const user = await getUserByDeviceId(deviceId as string)
    req.user = deviceId
    req.user = user.id
    return next()
  }
  const {sessionToken} = req.query
  const {decodedToken, error} = verifyToken(sessionToken as string)
  if (error || !decodedToken.id) {
    const message = error ? error.message : 'no hay usuario en el token'
    console.log(`checkToken: ${message}`, req.baseUrl, sessionToken)
    return res.status(401).send({auth: false, message})
  }
  req.user = {
    deviceId: decodedToken.deviceID,
    id: decodedToken.id,
  }
  return next()
}
