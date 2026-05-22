import express from 'express';
const router = express.Router();
import tarefaController from '../controllers/tarefaController';

router.post('/', tarefaController.criarTarefa);
router.get('/hoje', tarefaController.buscarTarefasHoje);
router.patch('/:id/concluir', tarefaController.concluirTarefa);
router.post('/:id/evidencias', tarefaController.anexarEvidencia);
// Opcional: router.get('/sincronizar', ...) se for tratar de forma apartada

export default router;


