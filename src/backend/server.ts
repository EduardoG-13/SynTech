/**
 * server.js - Entrypoint do backend BRPec.
 * Carrega variáveis de ambiente, inicializa o banco e inicia o servidor.
 */

require('dotenv').config();

import app from './app';
import { inicializarBanco } from './config/initDb';

// Inicializa o banco de dados (cria tabelas se necessário)
inicializarBanco();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[server] Servidor BrPec rodando na porta ${PORT}`);
  console.log(`   Health-check: http://localhost:${PORT}/api/health`);
});


