import express from 'express';
import createError from 'http-errors'
import toCamelCase from 'camelcase-keys';
import {
    proccessReelsData, gameInit, proccessReelsDataFromFS, spin, symbolsInDB, delItem,
} from '../services/slotService';
import { getOrSetUserByDeviceId, getProfile } from '../../meta/services/gameUserService';
import { checkToken } from '../middleware/authMiddleware';

import { getNewToken } from '../services/jwtService';

const router = express.Router();

router.get('/game_init', async (req, res) => {
    try {
        const { deviceId } = req.query
        const user = await getOrSetUserByDeviceId(deviceId);
        const token = getNewToken({ id: user.id }, process.env.TOKEN_EXPIRATION_TIME_PEDRO);
        const resp = await gameInit();
        const initData = {
            sessionId: token,
            profileData: toCamelCase(user),
            reelsData: resp.reelsData,
            walletData: {
                coins: 10,
                tickers: 3,
            },
        };
        return res.status(200).json(initData);
    } catch (error) {
        console.dir(error);
        throw createError(500, error)
    }
});
router.get('/spin', checkToken, async (req, res) => {
    const resp = await spin();
    res.status(200).json(resp);
});
router.get('/profile', checkToken, async (req, res) => {
    const resp = await getProfile(req.query.deviceId);
    res.status(200).json(toCamelCase(resp));
});
router.get('/symbols_in_db', async (req, res) => {
    const { fromFS } = req.params;
    const resp = await symbolsInDB(fromFS);
    res.status(200).json(resp);
});
router.delete('/item', async (req, res) => {
    const { itemId, fromFS: file = false } = req.query;
    console.log('detalle', itemId, file);
    const resp = await delItem(itemId, file);
    res.status(200).json(resp);
});
router.get('/proccess_reels_data_from_fs', async (req, res) => {
    const { path } = req.query;
    const resp = await proccessReelsDataFromFS(path);
    res.status(200).json(resp);
});
router.post('/proccess_reels_data', async (req, res) => {
    const resp = await proccessReelsData();
    res.status(200).json({ resp });
});
export default router;
