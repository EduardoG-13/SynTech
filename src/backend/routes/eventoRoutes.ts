import express from 'express';
const router = express.Router();
import eventoController from '../controllers/eventoController';

// Listagem geral de eventos zootécnicos (RF014, US11)
router.get('/', eventoController.listarEventos);

// Registro de nascimentos (RF008, RN27)
router.post('/nascimentos', eventoController.registrarNascimento);

// Registro de óbitos (RF009, RF013)
router.post('/obitos', eventoController.registrarObito);

export default router;



