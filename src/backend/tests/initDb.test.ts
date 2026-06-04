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
});
