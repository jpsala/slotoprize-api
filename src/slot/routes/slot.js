import express from 'express';
import {
    proccessReelsData, gameInit, proccessReelsDataFromFS, spin, symbolsInDB, delItem,
} from '../services/slotService';

const router = express.Router();

router.post('/proccess_reels_data', async (req, res) => {
    const resp = await proccessReelsData();
    res.status(200).json({ resp });
});
router.get('/game_init', async (req, res) => {
    const { deviceId } = req.query
    const resp = await gameInit(deviceId);
    res.status(resp.status).json(resp.json);
});
router.get('/proccess_reels_data_from_fs', async (req, res) => {
    const resp = await proccessReelsDataFromFS();
    res.status(200).json(resp);
});
router.get('/spin', async (req, res) => {
    const resp = await spin();
    res.status(200).json(resp);
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

export default router;
