import createError from 'http-errors'

import { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../../services/jwtService'
import { getGameUserByDeviceId } from "./meta-services/meta.service"

// const reqUser: { deviceId?: string, user?: number } = {}

// export const getReqUser = (): any =>
// {
//   console.log('no tendría que pasar por setuser en authmiddleware',)
//   return reqUser
// }
// export const setReqUser = (deviceId: string | undefined, user: number | undefined): void =>
// {
//   if (deviceId !== undefined) reqUser.deviceId = deviceId
//   if (user !== undefined) reqUser.user = user
// }
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
      throw createError(createError.BadRequest, `deviceId parameter missing ${req.baseUrl}${req.route?.path}`)
    }
    const _user = await getGameUserByDeviceId(deviceId as string)
    if (!_user) throw createError(createError.BadRequest, 'There is not user registered with that deviceId')
    // reqUser.deviceId = deviceId as string
    // reqUser.user = _user.id
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
    console.log(`checkToken: ${message}`, req.baseUrl, sessionToken)
    return res.status(401).send({ auth: false, message })
  }
  // console.log('decodedToken', decodedToken)
  req.user = {
    id: decodedToken.id,
    deviceId: decodedToken.devicedID
  }
  // reqUser.deviceId = decodedToken.devicedID
  // reqUser.user = decodedToken.id
  return next()
}
