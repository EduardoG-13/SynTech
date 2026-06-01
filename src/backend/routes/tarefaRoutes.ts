import express from 'express';
const router = express.Router();
import tarefaController from '../controllers/tarefaController';

router.post('/', (req, res, next) => tarefaController.criarTarefa(req, res, next));
router.get('/hoje', (req, res, next) => tarefaController.buscarTarefasHoje(req, res, next));
router.patch('/:id/concluir', (req, res, next) => tarefaController.concluirTarefa(req, res, next));
router.post('/:id/evidencias', (req, res, next) => tarefaController.anexarEvidencia(req, res, next));

export default router;


