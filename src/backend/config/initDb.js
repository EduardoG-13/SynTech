/**
 * config/initDb.js
 * Le e executa o migration.sql para criar as tabelas do banco.
 * Chamado uma vez na inicializacao do servidor.
 */

const fs = require('fs');
const path = require('path');
const db = require('./database');

/**
 * Inicializa o banco de dados executando o script de migration.
 * As tabelas usam IF NOT EXISTS, entao e seguro rodar varias vezes.
 */
function inicializarBanco() {
  try {
    const migrationPath = path.resolve(__dirname, '..', '..', 'src', 'migration.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error(`[initDb] ERRO: Arquivo de migration nao encontrado: ${migrationPath}`);
      console.error('   Verifique se o arquivo src/src/migration.sql existe.');
      return;
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    db.exec(sql);

    console.log('[initDb] Banco de dados inicializado com sucesso');
  } catch (err) {
    console.error('[initDb] ERRO ao inicializar banco:', err.message);
  }
}

module.exports = { inicializarBanco };
