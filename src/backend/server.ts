/**
 * server.js - Entrypoint do backend BRPec.
 * Carrega variáveis de ambiente, inicializa o banco e inicia o servidor.
 */

// Carrega o .env da raiz do projeto (g03/), funcione de onde for executado
const path = require('path');
require('dotenv').config(); // tenta o cwd primeiro
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); // fallback: raiz do projeto

import app from './app';
import { inicializarBanco } from './config/initDb';
import cloudSyncService from './services/cloudSyncService';
import db from './config/database';

// Inicializa o banco de dados (cria tabelas se necessário)
inicializarBanco();

// Auto-seed: se o banco estiver vazio (sem usuários), popula com retiros/usuários padrão.
// Garante que a primeira subida em Render/Railway/Fly não exija comando manual.
try {
  const totalUsuarios = (db.prepare('SELECT COUNT(*) AS n FROM usuarios').get() as any).n;
  if (totalUsuarios === 0) {
    console.log('[server] Banco vazio detectado — rodando seed inicial...');
    // Import dinâmico pra não rodar o IIFE do arquivo no caso normal
    require('./seed');
  } else {
    console.log(`[server] Banco já populado (${totalUsuarios} usuário(s)) — pulando seed.`);
  }
} catch (err: any) {
  console.error('[server] Falha ao verificar/popular seed:', err.message);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[server] Servidor BrPec rodando na porta ${PORT}`);
  console.log(`   Health-check: http://localhost:${PORT}/api/health`);

  // Inicializa o agendador de sincronização em nuvem (outbox) em produção/desenvolvimento
  if (process.env.NODE_ENV !== 'test' && process.env.ENABLE_CLOUD_SYNC === 'true') {
    cloudSyncService.iniciarAgendador();
  } else if (process.env.NODE_ENV !== 'test') {
    console.log('[server] Sincronização automática em nuvem (outbox) DESATIVADA via flag ENABLE_CLOUD_SYNC.');
  }
});


