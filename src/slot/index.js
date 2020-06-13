import express from 'express';
import slotRouter from './routes/slot';

const router = express.Router();

router.use('/', slotRouter);

export default router;
