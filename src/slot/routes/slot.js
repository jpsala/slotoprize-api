import express from 'express';
import { proccessReelsData, gameInit } from '../services/slotService';

const router = express.Router();

router.post('/proccess_reels_data', async (req, res) => {
  const resp = await proccessReelsData();
  res.status(200).json({ resp });
});

router.get('/game_init', async (req, res) => {
  const resp = await gameInit();
  res.status(200).json(resp);
});

export default router;
