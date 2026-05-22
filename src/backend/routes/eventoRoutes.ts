import express from 'express';
const router = express.Router();
import eventoController from '../controllers/eventoController';

router.post('/nascimentos', eventoController.registrarNascimento);

export default router;


