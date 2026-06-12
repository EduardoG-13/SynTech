import { Router } from 'express';
import { login, logout, refresh, loginCapataz, loginInfraestrutura, me } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/login-capataz', loginCapataz);
router.post('/login-infra', loginInfraestrutura);
router.post('/logout', logout);
router.get('/me', me);

export default router;
