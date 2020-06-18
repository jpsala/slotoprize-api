import express from 'express';
import authRoute from './routes/authRoute';
import user from './routes/userRoute';
import { checkToken } from './middleware/authMiddleware';

const router = express.Router();

router.use('/auth', authRoute);
router.use('*', checkToken);
router.use('/user', user);

export default router;
