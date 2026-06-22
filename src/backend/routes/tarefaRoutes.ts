import express from 'express';
const router = express.Router();
import tarefaController from '../controllers/tarefaController';
import { validateFields } from '../middlewares/validatorMiddleware';

router.post('/', validateFields(['titulo', 'retiro_id', 'capataz_id', 'data_execucao', 'gerente_id']), (req, res, next) => tarefaController.criarTarefa(req, res, next));
router.patch('/:id/concluir', validateFields(['id'], 'params'), validateFields(['capataz_id']), (req, res, next) => tarefaController.concluirTarefa(req, res, next));
router.post('/:id/evidencias', validateFields(['id'], 'params'), validateFields(['tipo', 'capataz_id']), (req, res, next) => tarefaController.anexarEvidencia(req, res, next));

router.get('/hoje', (req, res, next) => tarefaController.buscarTarefasHoje(req, res, next));

export default router;


