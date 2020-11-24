import { NextFunction, Request, Response } from 'express'
import createHttpError from 'http-errors'
import { BAD_REQUEST } from 'http-status-codes'

export function checkDeviceId(req: Request, res: Response, next: NextFunction): void {
  let { deviceId } = req.query
  if (!deviceId) deviceId = req.body?.deviceId
  if (!deviceId) deviceId = req.params?.deviceId
  if (!deviceId) throw createHttpError(BAD_REQUEST, 'Device ID is a required parameter')
  req.user = {id: -1, deviceId: deviceId as string, isDev: false}
  
  next()
}