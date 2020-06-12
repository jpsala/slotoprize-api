import express from 'express';
import auth from './routes/auth';
import user from './routes/user';
import { checkToken } from './middleware/authMiddleware';

const router = express.Router();

router.use('/auth', auth);
router.use('*', checkToken);
router.use('/user', user);

export default router;
