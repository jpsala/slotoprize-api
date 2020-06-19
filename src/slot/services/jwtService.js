import jwt from 'jsonwebtoken';

const tokenKey = 'Que Secreto!!!';
const getNewToken = (payload, expiresIn = 100000) => jwt.sign(payload, tokenKey, {
    expiresIn: `${expiresIn}s`,
});
const verifyToken = (token) => jwt.verify(token, tokenKey, (_error, decodedToken) => {
    let error;
    if (_error) {
        error = {
            message: (_error && _error.message === 'jwt expired') ? 'La sesión expiró\nVuelva a ingresar' : _error.message,
        };
        console.log('VerifyToken error! token:%O - error: %O', token, _error.message);
    }
    return { decodedToken, error };
});
export { getNewToken, verifyToken };
