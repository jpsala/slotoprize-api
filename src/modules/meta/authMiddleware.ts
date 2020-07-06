import {NextFunction, Request, Response} from 'express'
// import createError from 'http-errors'

import {verifyToken} from '../../services/jwtService'

// eslint-disable-next-line import/no-mutable-exports
export let reqUser: string
export function checkToken(req: Request, res: Response, next: NextFunction):any {
  const {sessionToken} = req.query
  const {decodedToken, error} = verifyToken(sessionToken as string)
  if (error || !decodedToken.id) {
    const message = error ? error.message : 'no hay usuario en el token'
    console.log(`checkToken: ${message}`, req.baseUrl, sessionToken)
    return res.status(401).send({auth: false, message})
  }
  req.user = decodedToken.id
  reqUser = decodedToken.id
  return next()
}
