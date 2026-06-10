/**
 * Testes de integração para inicialização do banco de dados.
 * Valida que inicializarBanco() cria todas as tabelas esperadas,
 * incluindo a tabela de controle schema_migrations.
 *
 * Traceabilidade:
 *   US09  - Sincronização automática via Starlink
 *   RF011 - Transmissão automática de pacotes offline
 *   BR11  - Confirmação do servidor central antes de limpar dados locais
 */

import db from '../config/database';
import { inicializarBanco } from '../config/initDb';
import fs from 'fs';
import path from 'path';

beforeAll(() => {
  inicializarBanco();
});

describe('inicializarBanco — Schema Initialization', () => {
  // ─────────────────────────────────────────────────────────
  // Tabela schema_migrations
  // ─────────────────────────────────────────────────────────
  describe('schema_migrations table', () => {
    it('deve criar a tabela schema_migrations com as colunas corretas', () => {
      const columns = db
        .prepare("PRAGMA table_info('schema_migrations')")
        .all() as Array<{ name: string; type: string; notnull: number; pk: number }>;

      expect(columns.length).toBe(3);

      const colMap = Object.fromEntries(columns.map((c) => [c.name, c]));

      // id — INTEGER PRIMARY KEY AUTOINCREMENT
      expect(colMap['id']).toBeDefined();
      expect(colMap['id'].type).toBe('INTEGER');
      expect(colMap['id'].pk).toBe(1);

      // migration_name — TEXT UNIQUE NOT NULL
      expect(colMap['migration_name']).toBeDefined();
      expect(colMap['migration_name'].type).toBe('TEXT');
      expect(colMap['migration_name'].notnull).toBe(1);

      // executed_at — TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      expect(colMap['executed_at']).toBeDefined();
      expect(colMap['executed_at'].type).toBe('TIMESTAMP');
    });

    it('deve permitir inserção e impor unicidade em migration_name', () => {
      db.prepare(
        "INSERT INTO schema_migrations (migration_name) VALUES ('001_initial_schema')"
      ).run();

      const row = db
        .prepare("SELECT * FROM schema_migrations WHERE migration_name = '001_initial_schema'")
        .get() as { id: number; migration_name: string; executed_at: string };

      expect(row).toBeDefined();
      expect(row.migration_name).toBe('001_initial_schema');
      expect(row.executed_at).toBeDefined();

      // Unicidade: inserir duplicata deve lançar erro
      expect(() => {
        db.prepare(
          "INSERT INTO schema_migrations (migration_name) VALUES ('001_initial_schema')"
        ).run();
      }).toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────
  // Tabelas existentes do migration.sql
  // ─────────────────────────────────────────────────────────
  describe('tabelas do migration.sql', () => {
    const expectedTables = [
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
      'exportacoes',
    ];

    it.each(expectedTables)('deve criar a tabela "%s"', (tableName) => {
      const result = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
        )
        .get(tableName) as { name: string } | undefined;

      expect(result).toBeDefined();
      expect(result!.name).toBe(tableName);
    });
  });

  // ─────────────────────────────────────────────────────────
  // Controle Transacional e Rollback em caso de erro
  // ─────────────────────────────────────────────────────────
  describe('controle transacional e rollback', () => {
    const migrationsDir = path.resolve(__dirname, '..', 'database', 'migrations');

    beforeAll(() => {
      // Garante que o diretório de migrations existe para o teste
      if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
      }
    });

    afterAll(() => {
      // Limpa os arquivos de teste criados temporariamente
      const testFiles = ['999_test_invalid_migration.sql'];
      for (const file of testFiles) {
        const filePath = path.join(migrationsDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      // Remove registros de migrations fictícias da tabela schema_migrations
      for (const file of testFiles) {
        try {
          db.prepare('DELETE FROM schema_migrations WHERE migration_name = ?').run(file);
        } catch (err) {
          // Silenciosamente ignora se a tabela não existir
        }
      }
    });

    it('deve reverter modificações (rollback) se a migration contiver SQL inválido', () => {
      const invalidMigrationName = '999_test_invalid_migration.sql';
      const invalidMigrationPath = path.join(migrationsDir, invalidMigrationName);

      // Cria uma migration que cria uma tabela temporária e depois executa um comando inválido
      const sqlContent = `
        CREATE TABLE tabela_teste_rollback (
          id INTEGER PRIMARY KEY
        );
        INSERT INTO tabela_teste_rollback (id) VALUES (1);
        -- Comando inválido que causará erro
        INSERT INTO tabela_inexistente (campo) VALUES ('erro');
      `;

      fs.writeFileSync(invalidMigrationPath, sqlContent, 'utf-8');

      // Tentar inicializar o banco deve lançar o erro
      expect(() => {
        inicializarBanco();
      }).toThrow();

      // Verificar que a migration NÃO foi registrada no schema_migrations
      const migrationRecord = db
        .prepare("SELECT * FROM schema_migrations WHERE migration_name = ?")
        .get(invalidMigrationName);
      expect(migrationRecord).toBeUndefined();

      // Verificar que a tabela criada na migration falha NÃO foi criada no banco (confirmando o rollback)
      const tableRecord = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tabela_teste_rollback'")
        .get() as { name: string } | undefined;
      expect(tableRecord).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────
  // Interpretador de Migrations Dinâmico
  // ─────────────────────────────────────────────────────────
  describe('interpretador de migrations dinâmico', () => {
    const migrationsDir = path.resolve(__dirname, '..', 'database', 'migrations');

    beforeAll(() => {
      // Garante que o diretório de migrations existe para o teste
      if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
      }
    });

    afterAll(() => {
      // Limpa os arquivos de teste criados temporariamente
      const testFiles = [
        '002_test1.sql',
        '003_test2.sql',
        '004_test3.sql'
      ];
      for (const file of testFiles) {
        const filePath = path.join(migrationsDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      // Remove registros de migrations fictícias da tabela schema_migrations
      for (const file of testFiles) {
        try {
          db.prepare('DELETE FROM schema_migrations WHERE migration_name = ?').run(file);
        } catch (err) {
          // Silenciosamente ignora se a tabela não existir
        }
      }
    });

    it('deve executar 3 novas migrations SQL na pasta de migrations e registrá-las', () => {
      const migrationsToTest = [
        {
          name: '002_test1.sql',
          sql: 'CREATE TABLE tabela_teste_1 (id INTEGER PRIMARY KEY);'
        },
        {
          name: '003_test2.sql',
          sql: 'CREATE TABLE tabela_teste_2 (id INTEGER PRIMARY KEY);'
        },
        {
          name: '004_test3.sql',
          sql: 'CREATE TABLE tabela_teste_3 (id INTEGER PRIMARY KEY);'
        }
      ];

      for (const m of migrationsToTest) {
        const filePath = path.join(migrationsDir, m.name);
        fs.writeFileSync(filePath, m.sql, 'utf-8');
      }

      // Executa a inicialização do banco
      inicializarBanco();

      // Verifica que as 3 migrations foram registradas
      for (const m of migrationsToTest) {
        const record = db
          .prepare("SELECT * FROM schema_migrations WHERE migration_name = ?")
          .get(m.name);
        expect(record).toBeDefined();
      }

      // Verifica que as 3 tabelas foram criadas no banco
      const expectedTables = ['tabela_teste_1', 'tabela_teste_2', 'tabela_teste_3'];
      for (const tableName of expectedTables) {
        const result = db
          .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
          .get(tableName) as { name: string } | undefined;
        expect(result).toBeDefined();
        expect(result!.name).toBe(tableName);
      }
    });
  });
});
