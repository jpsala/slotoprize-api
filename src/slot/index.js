import express from 'express';
import slotRouter from './routes/slotRoute';

const router = express.Router();

router.use('/', slotRouter);

export default router;
