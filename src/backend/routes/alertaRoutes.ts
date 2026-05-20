import express from 'express';
const router = express.Router();
import alertaController from '../controllers/alertaController';

router.post('/', alertaController.criarAlerta);

export default router;


