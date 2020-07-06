/* eslint-disable require-atomic-updates */
import {NextFunction, Request, Response} from 'express'
// import createError from 'http-errors'

import {verifyToken} from '../../services/jwtService'
import {getGameUserByDeviceId} from '../meta/meta.service'

export const reqUser: { deviceId?: string, user?: number } = {}
export async function checkToken(req: Request, res: Response, next: NextFunction):Promise<any> {
  const {'dev-request': dev} = req.headers
  const isDev = (dev === 'true')
  // const dev = req.headers['Dev-Request'];
  console.log('dev', isDev)
  if (isDev) {
    let {deviceId} = req.query
    if (!deviceId) deviceId = req.body.deviceId
    // if (!deviceId) {
    //   console.error(`falta deviceId in req.query in ${req.baseUrl}${req.route.path}`)
    //   throw createError(400, `deviceId parameter missing ${req.baseUrl}${req.route.path}`)
    // }
    const _user = await getGameUserByDeviceId(deviceId as string)
    req.user = {deviceId, user: _user.id}
    reqUser.deviceId = deviceId as string
    reqUser.user = _user.id
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
  reqUser.deviceId = decodedToken.devicdID
  reqUser.user = decodedToken.id
  return next()
}
