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
import dadosRoutes from './dadosRoutes';
import adminRoutes from './adminRoutes';
import coordenadorRoutes from './coordenadorRoutes';
import boletaRoutes from './boletaRoutes';
import dashboardRoutes from './dashboardRoutes';
import historicoRoutes from './historicoRoutes';

// Health-check
router.get('/health', healthController.verificarSaude);

// Dados de apoio para formulários (retiros, capatazes, categorias)
router.use('/dados', dadosRoutes);

// Administração (Gerente ADM): CRUD de retiros e usuários
router.use('/admin', adminRoutes);

// Coordenador: aprovar boletas + exportar CSV
router.use('/coordenador', coordenadorRoutes);

// Boletas (Capataz cria/edita/lista; Coordenador/Gerente leem)
router.use('/boletas', boletaRoutes);

// Dashboard (Gerente / Coordenador)
router.use('/dashboard', dashboardRoutes);

// Histórico unificado (todos os perfis, com filtros automáticos)
router.use('/historico', historicoRoutes);

// Tarefas
router.use('/tarefas', tarefaRoutes);

// Chamados (Alertas)
router.use('/chamados', alertaRoutes);
router.use('/alertas', alertaRoutes);

// Eventos Zootecnicos
router.use('/eventos-zootecnicos', eventoRoutes);

// Painel Gerencial (RF007)
router.use('/painel-gerencial', painelRoutes);

// Sincronização em Lote (RF010, RF011, RF012)
router.use('/sincronizacao', sincronizacaoRoutes);

// Exportação de Dados (RF015)
router.use('/exportacao', exportacaoRoutes);

export default router;



