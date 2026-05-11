/**
 * server.js - Entrypoint do backend BRPec.
 * Carrega variaveis de ambiente e inicia o servidor.
 */

require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Health-check: http://localhost:${PORT}/health`);
});
