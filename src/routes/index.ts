import { Router } from 'express';
import * as healthController from '../controllers/healthController';
import * as movimentacaoController from '../controllers/movimentacaoController';
import * as pageController from '../controllers/pageController';

const router = Router();

router.get('/', pageController.index);
router.get('/health', healthController.getHealth);
router.post('/movimentacoes/nascimentos', movimentacaoController.registrarNascimento);
router.get('/movimentacoes/nascimentos', movimentacaoController.listarNascimentos);
router.post('/demo/seed', movimentacaoController.prepararDemo);

export default router;
