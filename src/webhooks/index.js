/* eslint-disable camelcase */
import express from 'express';
import fs from 'fs';
import { join } from 'path';
import moment from 'moment';
import 'moment/locale/es-us';

const { spawn } = require('child_process');

const router = express.Router();
router.post('/', async (req, res) => {
  const jsonData = req.body
  spawn('touch', ['holaaaa']/* , { uid: 1000 } */);
  const filename = moment().format('YYYY_MM_DD_hh_mm');
  const fullfilename = join('/var/www/html/public/assets/webhook', `${filename}.json`);
  fs.writeFileSync(fullfilename, JSON.stringify(jsonData));
  res.status(200).json({ fileName: fullfilename });
  return undefined;
});
export default router;
