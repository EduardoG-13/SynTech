/**
 * config/initDb.js
 * Le e executa o migration.sql para criar as tabelas do banco.
 * Chamado uma vez na inicializacao do servidor.
 */

import fs from 'fs';
import path from 'path';
import db from './database';

/**
 * Inicializa o banco de dados executando o script de migration.
 * As tabelas usam IF NOT EXISTS, entao e seguro rodar varias vezes.
 */
function inicializarBanco() {
  try {
    const migrationPath = path.resolve(__dirname, '..', 'database', 'migration.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error(`[initDb] ERRO: Arquivo de migration nao encontrado: ${migrationPath}`);
      console.error('   Verifique se o arquivo src/backend/database/migration.sql existe.');
      return;
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    db.exec(sql);

    // Tabela de controle de historico de migrations (US09 / RF011 / BR11)
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration_name TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('[initDb] Banco de dados inicializado com sucesso');
  } catch (err) {
    console.error('[initDb] ERRO ao inicializar banco:', err.message);
  }
}

export { inicializarBanco  };


