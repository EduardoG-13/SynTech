import { Router } from 'express';
import { listarRetiros, listarCapatazes, dadosFormNovaOs } from '../controllers/dadosController';

const router = Router();

router.get('/retiros', listarRetiros);
router.get('/capatazes', listarCapatazes);
router.get('/form-nova-os', dadosFormNovaOs);

export default router;
