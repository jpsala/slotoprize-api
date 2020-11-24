/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../../services/jwtService'
import { getUserById } from './meta-services'

export async function checkTokenForBO(req: Request, res: Response, next: NextFunction): Promise<any> {
  const { token } = req.headers
  const { decodedToken, error } = verifyToken(token as string)
  if (error || !decodedToken.id) {
    const message = error ? error.message : 'Token error'
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`checkToken: ${message}`, req.baseUrl, token)
    return res.status(401).send({ auth: false, message })
  }
  
  let { deviceId } = req.query
  if (!deviceId) deviceId = req.body?.deviceId
  if (!deviceId) deviceId = req.params?.deviceId
  const user = await getUserById(decodedToken.id)
  if (!user) return res.status(401).send({ auth: false, message: 'User not found' })
  console.log('Auth:', `${user?.id}-${user.name}-Dev:${user?.isDev ? 'isDev' : 'notDev'}`)
  req.user = { id: decodedToken.id, deviceId: deviceId ? (deviceId as string) : '' , isDev:  user.isDev}

  return next()
}
