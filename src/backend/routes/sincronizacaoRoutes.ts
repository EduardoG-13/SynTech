import express from 'express';
const router = express.Router();
import sincronizacaoController from '../controllers/sincronizacaoController';

router.post('/lote', sincronizacaoController.processarLote);

export default router;
