/* eslint-disable @typescript-eslint/ban-types */
// eslint-disable-next-line import/default
import { sign, verify } from 'jsonwebtoken'

const tokenKey = 'Que Secreto!!!'
const getNewToken = (payload: string | Buffer | object, expiresIn = 100000): any => sign(payload, tokenKey, {
  expiresIn: `${expiresIn}s`,
})
const verifyToken = (token: string): any => {
  return verify(token, tokenKey, (_error, decodedToken): any => {
    let error
    if (_error) 
      error = {
        message: (_error && _error.message === 'jwt expired') ? 'La sesión expiró\nVuelva a ingresar' : _error.message,
      }
    
    return {decodedToken, error}
  })
}
export {getNewToken, verifyToken}
