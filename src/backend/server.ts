/**
 * server.js - Entrypoint do backend BRPec.
 * Carrega variáveis de ambiente, inicializa o banco e inicia o servidor.
 */

require('dotenv').config();

import app from './app';
import { inicializarBanco } from './config/initDb';
import cloudSyncService from './services/cloudSyncService';

// Inicializa o banco de dados (cria tabelas se necessário)
inicializarBanco();

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


