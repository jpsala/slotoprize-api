/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import express from 'express';
import { getNewToken, verifyToken } from '../services/jwtService';
import {
    getUsersByTerm, getUser, getUsers, auth, setUser, delUser,
} from '../services/userService';

const router = express.Router();

router.post('/', async (req, res) => {
    const user = req.body;
    const resp = setUser(user);
    res.status(200).json({ resp });
});
router.delete('/', async (req, res) => {
    const user = req.query;
    const resp = await delUser(user.id);
    res.status(200).json(resp);
});
router.get('/session', async (req, res) => {
    const loginToken = req.query.token;
    const statusToken = verifyToken(loginToken);
    const { id } = statusToken.decodedToken.user;
    const rows = await auth(id);
    const user = rows.length > 0 ? rows[0] : undefined;
    if (!user) {
        res.status(401).send({ auth: false, message: 'Error de credenciales, revise los datos' });
        return
    }
    const token = getNewToken({ user: { id: user.id, nombre: user.nombre } },
        process.env.TOKEN_EXPIRATION_TIME_PEDRO);
    res.setHeader('token', token);
    req.user = user;
    res.status(200).json({ user });
});
router.get('/users', async (req, res, next) => {
    try {
        const users = await getUsers();
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
});
router.get('/usersByTerm', async (req, res) => {
    console.log('req', req.query.term);
    const users = await getUsersByTerm(req.query.term);
    res.status(200).json(users);
});
router.get('/userByID', async (req, res, next) => {
    try {
        const users = await getUser(req.query.id);
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
});
export default router;
