import express from 'express';
const router = express.Router();
import alertaController from '../controllers/alertaController';

router.post('/', alertaController.criarAlerta);
router.get('/', alertaController.listarChamados);
router.patch('/:id/resolver', alertaController.resolverChamado);

export default router;

