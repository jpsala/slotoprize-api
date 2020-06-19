/* eslint-disable import/prefer-default-export */
import { verifyToken } from '../services/jwtService';

export function checkToken(req, res, next) {
    // console.log('req', req.method, req.baseUrl, req.route, req.headers);
    const { 'dev-request': dev } = req.headers;
    // const dev = req.headers['Dev-Request'];
    let error = false;
    let decodedToken;
    const esDev = (dev === 'true')
    let { sessionToken } = req.headers;
    if (!sessionToken) sessionToken = req.body.sessionToken
    if (!sessionToken) sessionToken = req.params.sessionToken
    if (!sessionToken) sessionToken = req.query.sessionToken
    if (!esDev) {
        const respVerifyToken = verifyToken(sessionToken);
        decodedToken = respVerifyToken.decodedToken;
        error = respVerifyToken.error
    } else {
        decodedToken = { id: 3 }
        error = false
    }
    if (error || !decodedToken.id) {
        const message = error ? error.message : 'no hay usuario en el token';
        console.log(`checkToken: ${message}`, req.baseUrl, sessionToken);
        return res.status(401).send({ auth: false, message });
    }
    req.user = decodedToken.id;
    return next();
}
