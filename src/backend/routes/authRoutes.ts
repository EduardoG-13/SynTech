import { Router } from 'express';
import { login, logout, refresh, loginCapataz, loginInfraestrutura, me, verificarDispositivo, loginDispositivo } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/login-capataz', loginCapataz);
router.post('/login-infra', loginInfraestrutura);
router.post('/login-dispositivo', loginDispositivo);
router.get('/dispositivo/:token', verificarDispositivo);
router.post('/logout', logout);
router.get('/me', me);

export default router;
