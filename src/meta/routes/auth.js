import express from 'express';
import { auth } from '../services/userService';
import { getNewToken, verifyToken } from '../services/jwtService';

const router = express.Router();

router.get('/with-token', async (req, res) => {
  const loginToken = req.params.token;
  const statusToken = verifyToken(loginToken);
  const { id } = statusToken.decodedToken.user;
  console.log('status', statusToken, 'id', id);
  const user = await auth(id);
  if (!user) {
    return res.status(401).send({ auth: false, message: 'Error de credenciales, revise los datos' });
  }
  const token = getNewToken({ user: { id: user.id, nombre: user.nombre } },
    process.env.TOKEN_EXPIRATION_TIME_PEDRO);
  res.setHeader('token', token);
  req.user = user;
  res.status(200).json({ user });
  return undefined;
});
router.post('/', async (req, res) => {
  const rows = await auth(req.body);
  const user = rows.length > 0 ? rows[0] : undefined;
  if (!user) {
    return res.status(401).send({ auth: false, message: 'Error de credenciales, revise los datos' });
  }
  const token = getNewToken({ user: { id: user.id, nombre: user.nombre } }, process.env.TOKEN_EXPIRATION_TIME_PEDRO);
  res.setHeader('token', token);
  req.user = user;
  res.status(200).json({ user });
  return undefined;
});

export default auth;
