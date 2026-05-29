/**
 * routes/index.js - Agregador de rotas da API.
 */

import express from 'express';
const router = express.Router();

import healthController from '../controllers/healthController';
import tarefaRoutes from './tarefaRoutes';
import alertaRoutes from './alertaRoutes';
import eventoRoutes from './eventoRoutes';
import painelRoutes from './painelRoutes';
import sincronizacaoRoutes from './sincronizacaoRoutes';
import exportacaoRoutes from './exportacaoRoutes';

// Health-check
router.get('/health', healthController.verificarSaude);

// Tarefas
router.use('/tarefas', tarefaRoutes);

// Chamados (Alertas)
router.use('/chamados', alertaRoutes);

// Eventos Zootecnicos
router.use('/eventos-zootecnicos', eventoRoutes);

// Painel Gerencial (RF007)
router.use('/painel-gerencial', painelRoutes);

// Sincronização em Lote (RF010, RF011, RF012)
router.use('/sincronizacao', sincronizacaoRoutes);

// Exportação de Dados (RF015)
router.use('/exportacao', exportacaoRoutes);

export default router;



