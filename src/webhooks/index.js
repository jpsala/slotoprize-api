import express from 'express';
import fs from 'fs';
import { join } from 'path';
import moment from 'moment';
import 'moment/locale/es-us';

const router = express.Router();
router.post('/', async (req, res) => {
  const filename = moment().format('YYYY_MM_DD_hh_mm');
  const path = join(__dirname, 'files')
  fs.writeFileSync(join(path, `${filename}.json`), JSON.stringify(req.body));
  res.status(200).json({ hola: filename });
  return undefined;
});

export default router;
