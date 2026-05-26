import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

let connection: Database.Database | undefined;

const migrationsDir = path.resolve(__dirname, 'migrations');

const getMigrationFiles = (): string[] => {
  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => path.join(migrationsDir, file));
};

export const getDatabase = (): Database.Database => {
  if (!connection) {
    const file = process.env.SQLITE_DATABASE_PATH || ':memory:';
    if (file !== ':memory:') {
      fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
    }
    connection = new Database(file);
    connection.pragma('foreign_keys = ON');

    for (const migrationFile of getMigrationFiles()) {
      connection.exec(fs.readFileSync(migrationFile, 'utf8'));
    }
  }

  return connection;
};

export const query = async (sql: string, params: unknown[] = []) => {
  const db = getDatabase();
  const normalized = sql.trim().toLowerCase();

  if (normalized.startsWith('select')) {
    return { rows: db.prepare(sql).all(params) };
  }

  const result = db.prepare(sql).run(params);
  return { rowCount: result.changes };
};

export const resetDatabase = (): void => {
  const db = getDatabase();
  db.exec(`
    DELETE FROM sync_queue;
    DELETE FROM evidencias;
    DELETE FROM nascimentos;
    DELETE FROM obitos;
    DELETE FROM transferencias;
    DELETE FROM compravendas;
    DELETE FROM movimentacoes;
    DELETE FROM tarefas;
    DELETE FROM alertas;
    DELETE FROM usuarios;
    DELETE FROM retiros;
  `);
};
