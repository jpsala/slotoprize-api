import express from 'express';
import { proccessReelsData, gameInit, proccessReelsDataFromFS } from '../services/slotService';

const router = express.Router();

router.post('/proccess_reels_data', async (req, res) => {
  const resp = await proccessReelsData();
  res.status(200).json({ resp });
});

router.get('/game_init', async (req, res) => {
  const resp = await gameInit();
  res.status(200).json(resp);
});
router.get('/proccess_reels_data_from_fs', async (req, res) => {
  const resp = await proccessReelsDataFromFS();
  res.status(200).json(resp);
});

export default router;
