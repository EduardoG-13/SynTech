import dotenv from 'dotenv';
import path from 'path';

// Resolve environment variables from root directory .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import db from './config/database';
import { inicializarBanco } from './config/initDb';
import supabasePool from './config/supabasePool';

async function downsync() {
  console.log('=== INICIANDO DOWN-SYNC (SUPABASE -> SQLITE LOCAL) ===');
  console.log(`SQLite Path: ${process.env.DB_PATH || './database/brpec.sqlite'}`);

  if (!process.env.DATABASE_URL) {
    console.error('Erro: DATABASE_URL não definida no .env');
    process.exit(1);
  }

  // Inicializa tabelas vazias no SQLite se não existirem
  inicializarBanco();

  // Desabilita chaves estrangeiras temporariamente para evitar erros de ordem de inserção
  db.exec('PRAGMA foreign_keys = OFF');
  console.log('⚙️ Chaves estrangeiras desativadas temporariamente no SQLite.');

  // Lista ordenada das tabelas a serem importadas
  const tabelas = [
    'retiros',
    'usuarios',
    'tarefas',
    'evidencias',
    'alertas',
    'movimentacoes',
    'nascimentos',
    'obitos',
    'transferencias',
    'compravendas',
    'sincronizacoes',
    'exportacoes'
  ];

  let totalImportado = 0;

  try {
    for (const tabela of tabelas) {
      console.log(`\nBaixando dados da tabela: "${tabela}" do Supabase...`);

      // 1. Buscar do Supabase
      const pgRes = await supabasePool.query(`SELECT * FROM ${tabela}`);
      const rows = pgRes.rows;

      if (rows.length === 0) {
        console.log(`   Nenhum registro encontrado para "${tabela}".`);
        continue;
      }

      console.log(`   Encontrados ${rows.length} registros no Supabase. Gravando no SQLite...`);

      // Obter colunas dessa tabela no SQLite
      const sqliteColsQuery = db.prepare(`PRAGMA table_info(${tabela})`);
      const sqliteCols = sqliteColsQuery.all() as { name: string; type: string }[];
      const colNames = sqliteCols.map(c => c.name);

      // Preparar query de INSERT OR REPLACE
      const placeholders = colNames.map(() => '?').join(', ');
      const sqlInsert = `INSERT OR REPLACE INTO ${tabela} (${colNames.join(', ')}) VALUES (${placeholders})`;
      const stmt = db.prepare(sqlInsert);

      let count = 0;
      db.exec('BEGIN TRANSACTION');
      try {
        for (const row of rows) {
          const params = colNames.map(col => {
            let val = row[col];
            // Converter booleanos do PG para 0 ou 1 para o SQLite
            if (typeof val === 'boolean') {
              val = val ? 1 : 0;
            }
            // Converter objetos Date do PG para strings no SQLite (padrão TIMESTAMP ISO)
            if (val instanceof Date) {
              val = val.toISOString().replace('T', ' ').substring(0, 19);
            }
            return val !== undefined ? val : null;
          });
          stmt.run(...params);
          count++;
        }
        db.exec('COMMIT');
        console.log(`   ✅ Importados ${count} registros para a tabela "${tabela}".`);
        totalImportado += count;
      } catch (err) {
        db.exec('ROLLBACK');
        console.error(`   ❌ Erro ao gravar na tabela "${tabela}":`, err);
        throw err;
      }
    }

    console.log('\n=== CONCLUSÃO ===');
    console.log(`✅ Downsync finalizado com sucesso! Total de registros sincronizados localmente: ${totalImportado}`);
  } catch (err) {
    console.error('\n❌ Erro durante o processo de downsync:', err);
  } finally {
    // Reativa as chaves estrangeiras
    db.exec('PRAGMA foreign_keys = ON');
    console.log('⚙️ Chaves estrangeiras reativadas no SQLite.');
    await supabasePool.end();
  }
}

downsync();
