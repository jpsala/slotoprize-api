/* eslint-disable import/prefer-default-export */
import { verifyToken, getNewToken } from '../services/jwtService';

export function checkToken(req, res, next) {
    // console.log('req', req.method, req.baseUrl, req.route, req.headers);
    const { token } = req.headers;
    const { decodedToken, error } = verifyToken(token);

    if (error || !decodedToken.user) {
        const message = error ? error.message : 'no hay usuario en el token';
        console.log(`checkToken: ${message}`, req.baseUrl, token);
        return res.status(401).send({ auth: false, message });
    }
    req.user = decodedToken.user;
    const seconds = Math.floor(decodedToken.exp - (new Date().getTime() + 1) / 1000);
    if (seconds < 60) {
        const newToken = getNewToken({ user: decodedToken.user });
        res.setHeader('token', newToken);
    }
    return next();
}
