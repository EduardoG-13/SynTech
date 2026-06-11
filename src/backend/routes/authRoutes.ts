import { Router } from 'express';
import { login, logout, loginCapataz, loginInfraestrutura, me } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/login-capataz', loginCapataz);
router.post('/login-infra', loginInfraestrutura);
router.post('/logout', logout);
router.get('/me', me);

export default router;
