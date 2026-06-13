import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

process.env.DB_PATH = ':memory:';

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');

  const migrationPath = path.resolve(__dirname, '..', 'database', 'migration.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  db.exec('BEGIN');
  try {
    db.exec(sql);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  (global as any).testDb = db;
});

afterEach(() => {
  db.close();
  (global as any).testDb = undefined;
});
