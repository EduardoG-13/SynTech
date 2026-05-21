/**
 * routes/index.js - Agregador de rotas da API.
 */

import express from 'express';
const router = express.Router();

import healthController from '../controllers/healthController';
import tarefaRoutes from './tarefaRoutes';
import alertaRoutes from './alertaRoutes';
import eventoRoutes from './eventoRoutes';

// Health-check
router.get('/health', healthController.verificarSaude);

// Tarefas
router.use('/tarefas', tarefaRoutes);

// Chamados (Alertas)
router.use('/chamados', alertaRoutes);

// Eventos Zootecnicos
router.use('/eventos-zootecnicos', eventoRoutes);

export default router;


