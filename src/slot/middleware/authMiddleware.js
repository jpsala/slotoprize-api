/* eslint-disable import/prefer-default-export */
import { verifyToken } from '../services/jwtService';

export function checkToken(req, res, next) {
    // console.log('req', req.method, req.baseUrl, req.route, req.headers);
    let { sessionToken } = req.headers;
    if (!sessionToken) sessionToken = req.body.sessionToken
    if (!sessionToken) sessionToken = req.params.sessionToken
    if (!sessionToken) sessionToken = req.query.sessionToken

    const { decodedToken, error } = verifyToken(sessionToken);

    if (error || !decodedToken.id) {
        const message = error ? error.message : 'no hay usuario en el token';
        console.log(`checkToken: ${message}`, req.baseUrl, sessionToken);
        return res.status(401).send({ auth: false, message });
    }
    req.user = decodedToken.id;
    return next();
}
