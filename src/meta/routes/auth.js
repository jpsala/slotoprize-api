import express from 'express';
import { auth, getUser } from '../services/userService';
import { getNewToken, verifyToken } from '../services/jwtService';

const router = express.Router();

router.get('/with-token', async (req, res) => {
    console.log('req', req);
    const loginToken = req.query.token;
    const statusToken = verifyToken(loginToken);
    console.log('st', statusToken);
    const { id } = statusToken.decodedToken.user;
    console.log('status', statusToken, 'id', id);
    const user = await getUser(id);
    if (!user) {
        return res.status(401).send({ auth: false, message: 'Error de credenciales, revise los datos' });
    }
    const token = getNewToken({ user: { id: user.id, name: user.name } },
        process.env.TOKEN_EXPIRATION_TIME_PEDRO);
    res.setHeader('token', token);
    req.user = user;
    const retUser = { name: user.name, email: user.email, id: user.id }
    res.status(200).json({ user: retUser });
    return undefined;
});
router.post('/', async (req, res) => {
    try {
        const rows = await auth(req.body);
        console.log('rows', rows);
        const user = rows.length > 0 ? rows[0] : undefined;
        if (!user) {
            return res.status(401).send({ auth: false, message: 'Error de credenciales, revise los datos' });
        }
        const token = getNewToken({ user: { id: user.id, name: user.name } }, process.env.TOKEN_EXPIRATION_TIME_PEDRO);
        res.setHeader('token', token);
        req.user = user;
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json(error)
    }
    return undefined;
});

export default router;
