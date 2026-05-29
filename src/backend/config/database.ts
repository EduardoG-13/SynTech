/**
 * config/database.js
 * Configuracao e inicializacao do banco SQLite local (offline-first).
 * Usa node:sqlite (embutido no Node.js >= 22.5.0) -- operacoes sincronas.
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || './database/brpec.sqlite';
const resolvedPath = dbPath === ':memory:' ? ':memory:' : path.resolve(__dirname, '..', dbPath);

// Cria o diretorio do banco se nao existir
const dbDir = path.dirname(resolvedPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`[database] Diretorio do banco criado: ${dbDir}`);
}

// Abre (ou cria) o banco SQLite
const db = new DatabaseSync(resolvedPath);

// Habilita chaves estrangeiras
db.exec('PRAGMA foreign_keys = ON');

console.log(`[database] Banco SQLite conectado: ${resolvedPath}`);

export default db;


