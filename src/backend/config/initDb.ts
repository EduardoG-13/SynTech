/**
 * config/initDb.ts
 * Le e executa o migration.sql e migrations adicionais para criar e atualizar as tabelas do banco.
 * Chamado uma vez na inicializacao do servidor.
 */

import fs from 'fs';
import path from 'path';
import db from './database';

interface Migration {
  name: string;
  filePath: string;
}

/**
 * Inicializa o banco de dados executando as migrations pendentes.
 * Garante integridade transacional com rollback em caso de falha.
 */
function inicializarBanco() {
  // 1. Garantir que a tabela de histórico de migrations existe antes de qualquer coisa
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_name TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Coletar a lista ordenada de migrations
  const migrations: Migration[] = [];

  // Migration base (migration.sql)
  const baseMigrationPath = path.resolve(__dirname, '..', 'database', 'migration.sql');
  if (fs.existsSync(baseMigrationPath)) {
    migrations.push({
      name: 'migration.sql',
      filePath: baseMigrationPath,
    });
  } else {
    console.error(`[initDb] ERRO: Arquivo de migration base não encontrado: ${baseMigrationPath}`);
    throw new Error(`Arquivo de migration base não encontrado: ${baseMigrationPath}`);
  }

  // Migrations adicionais da pasta 'migrations'
  const migrationsDir = path.resolve(__dirname, '..', 'database', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort(); // Executa em ordem alfabética/numérica

    for (const file of files) {
      migrations.push({
        name: file,
        filePath: path.join(migrationsDir, file),
      });
    }
  }

  // 3. Obter migrations já executadas
  const executedMigrations = new Set<string>();
  try {
    const rows = db.prepare('SELECT migration_name FROM schema_migrations').all() as { migration_name: string }[];
    for (const row of rows) {
      executedMigrations.add(row.migration_name);
    }
  } catch (err) {
    console.error('[initDb] ERRO ao ler migrations executadas:', err.message);
    throw err;
  }

  // 4. Executar migrations pendentes dentro de transação individual por arquivo
  const pendingMigrations = migrations.filter((m) => !executedMigrations.has(m.name));

  for (const migration of pendingMigrations) {
    console.log(`[initDb] Iniciando execução da migration: ${migration.name}`);
    
    // Abre a transação
    db.exec('BEGIN TRANSACTION;');

    try {
      // Tenta ler o conteúdo SQL do arquivo
      const sql = fs.readFileSync(migration.filePath, 'utf-8');
      
      // Tenta executar o conteúdo SQL do arquivo
      db.exec(sql);

      // Registra a execução no schema_migrations
      const stmt = db.prepare('INSERT INTO schema_migrations (migration_name) VALUES (?)');
      stmt.run(migration.name);

      // Confirma a transação
      db.exec('COMMIT;');
      console.log(`[initDb] Migration '${migration.name}' executada e registrada com sucesso.`);
    } catch (err) {
      // Em caso de erro, desfaz a transação
      try {
        db.exec('ROLLBACK;');
      } catch (rollbackErr) {
        console.error('[initDb] ERRO ao executar ROLLBACK:', rollbackErr.message);
      }
      
      console.error(`[initDb] ERRO ao executar a migration '${migration.name}':`, err.message);
      throw err; // Lança a exceção para interromper o bootstrap do Express
    }
  }

  console.log('[initDb] Banco de dados inicializado com sucesso.');
}

export { inicializarBanco };


