import express from 'express';
const router = express.Router();
import alertaController from '../controllers/alertaController';

router.post('/', alertaController.criarAlerta);
router.get('/', alertaController.listarChamados);
router.get('/:id', alertaController.obterChamado);
router.patch('/:id/iniciar', alertaController.iniciarChamado);
router.patch('/:id/resolver', alertaController.resolverChamado);
router.put('/:id/resolver', alertaController.resolverChamado);  // alias PUT

export default router;

