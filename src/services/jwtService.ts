/* eslint-disable @typescript-eslint/ban-types */
import jwt from 'jsonwebtoken'

const tokenKey = 'Que Secreto!!!'
const getNewToken = (payload: string | Buffer | object, expiresIn = 100000): any => jwt.sign(payload, tokenKey, {
  expiresIn: `${expiresIn}s`,
})
const verifyToken = (token: string): any => {
  return jwt.verify(token, tokenKey, (_error, decodedToken): any => {
    let error
    if (_error) {
      error = {
        message: (_error && _error.message === 'jwt expired') ? 'La sesión expiró\nVuelva a ingresar' : _error.message,
      }
      console.log('VerifyToken error! token:%O - error: %O', token, _error.message)
    }
    return {decodedToken, error}
  })
}
export {getNewToken, verifyToken}
