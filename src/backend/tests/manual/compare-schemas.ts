import dotenv from 'dotenv';
import path from 'path';

// Resolve environment variables from root directory .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import db from '../../config/database';
import { inicializarBanco } from '../../config/initDb';
import supabasePool from '../../config/supabasePool';

async function compareSchemas() {
  // Inicializa o banco de dados local executando as migrations se necessário
  inicializarBanco();

  console.log('=== INICIANDO COMPARAÇÃO DE SCHEMAS ===');
  console.log(`SQLite Path: ${process.env.DB_PATH || './database/brpec.sqlite'}`);
  console.log(`Supabase URL: ${process.env.DATABASE_URL ? 'Definida (configurada no .env)' : 'NÃO DEFINIDA'}`);

  if (!process.env.DATABASE_URL) {
    console.error('Erro: DATABASE_URL não está definida no arquivo .env.');
    process.exit(1);
  }

  // 1. Obter tabelas do SQLite
  const sqliteTablesQuery = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'schema_migrations'");
  const sqliteTables = (sqliteTablesQuery.all() as { name: string }[]).map(t => t.name).sort();

  console.log(`\nTabelas encontradas no SQLite (${sqliteTables.length}):`, sqliteTables.join(', '));

  // 2. Obter tabelas do Supabase
  let pgClient;
  let pgColumns: any[] = [];
  try {
    pgClient = await supabasePool.connect();
    const pgRes = await pgClient.query(`
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM 
        information_schema.columns 
      WHERE 
        table_schema = 'public' 
      ORDER BY 
        table_name, ordinal_position;
    `);
    pgColumns = pgRes.rows;
  } catch (err) {
    console.error('Erro ao conectar ou consultar o Supabase:', err);
    process.exit(1);
  } finally {
    if (pgClient) pgClient.release();
  }

  const pgTables = Array.from(new Set(pgColumns.map(c => c.table_name))).sort() as string[];
  console.log(`Tabelas encontradas no Supabase (${pgTables.length}):`, pgTables.join(', '));

  // 3. Comparar tabelas
  console.log('\n--- VERIFICAÇÃO DE TABELAS ---');
  let hasErrors = false;

  const sqliteOnly = sqliteTables.filter(t => !pgTables.includes(t));
  const pgOnly = pgTables.filter(t => !sqliteTables.includes(t));

  if (sqliteOnly.length > 0) {
    console.warn(`⚠️ [Aviso] Tabelas apenas no SQLite:`, sqliteOnly);
    hasErrors = true;
  }
  if (pgOnly.length > 0) {
    console.warn(`⚠️ [Aviso] Tabelas apenas no Supabase:`, pgOnly);
    hasErrors = true;
  }

  if (sqliteOnly.length === 0 && pgOnly.length === 0) {
    console.log('✅ Ambas as bases de dados possuem exatamente as mesmas tabelas.');
  }

  // 4. Comparar colunas por tabela
  console.log('\n--- VERIFICAÇÃO DETALHADA DE COLUNAS ---');
  const commonTables = sqliteTables.filter(t => pgTables.includes(t));

  for (const table of commonTables) {
    console.log(`\nComparando tabela: "${table}"`);
    
    // Obter colunas do SQLite
    const sqliteColumnsQuery = db.prepare(`PRAGMA table_info(${table})`);
    const sqliteCols = sqliteColumnsQuery.all() as {
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: any;
      pk: number;
    }[];

    // Obter colunas do Supabase
    const pgCols = pgColumns.filter(c => c.table_name === table);

    // Mapeamento de colunas por nome
    const sqliteColsMap = new Map(sqliteCols.map(c => [c.name, c]));
    const pgColsMap = new Map(pgCols.map(c => [c.column_name, c]));

    // Verificar colunas extras/faltantes
    const onlyInSqlite = sqliteCols.map(c => c.name).filter(name => !pgColsMap.has(name));
    const onlyInPg = pgCols.map(c => c.column_name).filter(name => !sqliteColsMap.has(name));

    if (onlyInSqlite.length > 0) {
      console.error(`❌ Colunas apenas no SQLite para a tabela ${table}:`, onlyInSqlite);
      hasErrors = true;
    }
    if (onlyInPg.length > 0) {
      console.error(`❌ Colunas apenas no Supabase para a tabela ${table}:`, onlyInPg);
      hasErrors = true;
    }

    // Comparar tipos e nulabilidade
    for (const [colName, sqliteCol] of sqliteColsMap) {
      const pgCol = pgColsMap.get(colName);
      if (!pgCol) continue; // já reportado acima

      // Comparação simplificada de tipo
      const sqliteType = sqliteCol.type.toUpperCase();
      const pgType = pgCol.data_type.toLowerCase();

      // Mapear compatibilidade
      let isCompatible = false;
      if (sqliteType === 'TEXT' && (pgType === 'text' || pgType === 'character varying' || pgType === 'jsonb')) {
        isCompatible = true;
      } else if (sqliteType === 'INTEGER' && (pgType === 'integer' || pgType === 'bigint' || pgType === 'smallint')) {
        isCompatible = true;
      } else if (sqliteType === 'REAL' && (pgType === 'double precision' || pgType === 'real' || pgType === 'numeric')) {
        isCompatible = true;
      } else if (sqliteType === 'BOOLEAN' && (pgType === 'boolean' || pgType === 'integer')) {
        isCompatible = true;
      } else if ((sqliteType === 'DATETIME' || sqliteType === 'TIMESTAMP' || sqliteType === 'DATE') && 
                 (pgType === 'timestamp without time zone' || pgType === 'timestamp with time zone' || pgType === 'date' || pgType === 'timestamp')) {
        isCompatible = true;
      } else if (sqliteType === '' && pgType === 'text') {
        isCompatible = true;
      }

      if (!isCompatible) {
        console.warn(`⚠️ [Aviso de Tipo] Coluna "${colName}": SQLite = "${sqliteCol.type}", Supabase = "${pgCol.data_type}"`);
      }

      // Comparar nulabilidade
      const sqliteNullable = sqliteCol.notnull === 0;
      const pgNullable = pgCol.is_nullable === 'YES';

      if (sqliteNullable !== pgNullable) {
        console.error(`❌ [Erro de Nulabilidade] Coluna "${colName}": SQLite é nula? ${sqliteNullable}, Supabase é nula? ${pgNullable}`);
        hasErrors = true;
      }
    }
  }

  console.log('\n--- CONCLUSÃO ---');
  if (hasErrors) {
    console.error('❌ Existem divergências ou incompatibilidades na estrutura dos bancos de dados.');
  } else {
    console.log('✅ Sucesso! Os schemas do SQLite local e Supabase remoto estão totalmente alinhados e compatíveis.');
  }

  // Fechar conexões
  await supabasePool.end();
}

compareSchemas().catch(err => {
  console.error('Erro ao executar comparação:', err);
  process.exit(1);
});
