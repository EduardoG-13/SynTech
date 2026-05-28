import express from 'express';
const router = express.Router();
import exportacaoController from '../controllers/exportacaoController';

router.get('/csv', exportacaoController.exportarCsv);

export default router;
