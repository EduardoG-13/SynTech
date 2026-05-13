/**
 * config/database.js - Pool de conexao PostgreSQL (Supabase).
 *
 * Uso nos repositories:
 *   const db = require('../config/database');
 *   const result = await db.query('SELECT * FROM tabela WHERE id = $1', [id]);
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Erro no pool de conexao:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
