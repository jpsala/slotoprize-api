/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import express from 'express';
import { getNewToken, verifyToken } from '../services/jwtService';
import {} from '../services/gameUserService';

const router = express.Router();

router.post('/', async (req, res) => {
    const user = req.body;
    const resp = setUser(user);
    res.status(200).json({ resp });
});

export default router;
