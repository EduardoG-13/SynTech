/**
 * tests/unit/cloudSyncService.test.ts
 *
 * Suite de testes de serviço — CloudSyncService.sincronizar
 *
 * Padrão de rastreabilidade (Outbox Pattern — fila sincronizacoes):
 *   CT-CS01 – CT-CS04  — comportamentos gerais (offline, tarefa, erro upsert, alerta)
 *   CT-CS05 – CT-CS09  — movimentações (nascimento, óbito, transferência, compravenda, ROLLBACK)
 *   CT-CS10 – CT-CS11  — evidências
 *   CT-CS12 – CT-CS13  — retiros
 *   CT-CS14 – CT-CS15  — usuários
 *
 * Nota: teste híbrido — usa SQLite real (fila) + mock do pool Supabase (rede).
 * Padrão de estruturação: AAA (Arrange · Act · Assert)
 */

import db from '../../config/database';
import { inicializarBanco } from '../../config/initDb';
import cloudSyncService from '../../services/cloudSyncService';
import supabasePool from '../../config/supabasePool';
import { v7 as uuidv7 } from 'uuid';

// Mock the supabasePool
jest.mock('../../config/supabasePool', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockPool,
  };
});

const mockPool = supabasePool as any;

describe('CloudSyncService', () => {
  const RETIRO_ID = 'retiro-sync-001';
  const CAPATAZ_ID = 'capataz-sync-001';
  const GERENTE_ID = 'gerente-sync-001';

  beforeAll(() => {
    inicializarBanco();
  });

  beforeEach(() => {
    // Clear all tables (children before parents to respect FK constraints)
    db.exec(`
      DELETE FROM sincronizacoes;
      DELETE FROM exportacoes;
      DELETE FROM compravendas;
      DELETE FROM transferencias;
      DELETE FROM obitos;
      DELETE FROM nascimentos;
      DELETE FROM movimentacoes;
      DELETE FROM alertas;
      DELETE FROM evidencias;
      DELETE FROM tarefas;
      DELETE FROM usuarios;
      DELETE FROM retiros;
    `);

    // Setup basic seeds
    db.prepare('INSERT INTO retiros (id, nome, localizacao, coordenador_id) VALUES (?, ?, ?, ?)').run(RETIRO_ID, 'Retiro Sinc', 'Central', GERENTE_ID);
    db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)').run(GERENTE_ID, 'Gerente Sync', 'hash', 'Gerente', null);
    db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)').run(CAPATAZ_ID, 'Capataz Sync', 'hash', 'Capataz', RETIRO_ID);

    jest.clearAllMocks();
  });

  describe('sincronizar — casos gerais', () => {
    // Estes casos usam pool.query direto (sem transação).
    // Casos com transação de banco estão em describe('movimentacao').
    it('[CT-CS01] Deve suspender a sincronização se não houver conexão com o Supabase (offline)', async () => {
      // Arrange: Mock pool query to throw connection error
      mockPool.query.mockRejectedValueOnce(new Error('Connection refused'));

      const job_id = uuidv7();
      const task_id = uuidv7();
      db.prepare(`
        INSERT INTO tarefas (id, titulo, status, data_execucao, retiro_id, capataz_id, gerente_id, sincronizada)
        VALUES (?, 'Tarefa pendente', 'PENDENTE', '2026-06-25', ?, ?, ?, 0)
      `).run(task_id, RETIRO_ID, CAPATAZ_ID, GERENTE_ID);

      db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
        VALUES (?, 'tarefa', ?, 'PENDENTE', 0)
      `).run(job_id, task_id);

      // Act
      await cloudSyncService.sincronizar();

      // Assert: should exit early without modifying status or running updates
      const syncItem = db.prepare('SELECT * FROM sincronizacoes WHERE id = ?').get(job_id) as any;
      expect(syncItem.status_envio).toBe('PENDENTE');
      expect(syncItem.tentativas).toBe(0);
      expect(mockPool.query).toHaveBeenCalledTimes(1); // Only did check query ('SELECT 1')
    });

    it('[CT-CS02] Deve processar e sincronizar tarefas com sucesso quando online', async () => {
      // Arrange: Mock SELECT 1 and INSERT success
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any) // SELECT 1
        .mockResolvedValueOnce({ rowCount: 1, rows: [] } as any);    // Insert query

      const job_id = uuidv7();
      const task_id = uuidv7();
      db.prepare(`
        INSERT INTO tarefas (id, titulo, status, data_execucao, retiro_id, capataz_id, gerente_id, sincronizada)
        VALUES (?, 'Tarefa pendente', 'PENDENTE', '2026-06-25', ?, ?, ?, 0)
      `).run(task_id, RETIRO_ID, CAPATAZ_ID, GERENTE_ID);

      db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
        VALUES (?, 'tarefa', ?, 'PENDENTE', 0)
      `).run(job_id, task_id);

      // Act
      await cloudSyncService.sincronizar();

      // Assert: queue status should be updated to SINCRONIZADO and local table flag set to 1
      const syncItem = db.prepare('SELECT * FROM sincronizacoes WHERE id = ?').get(job_id) as any;
      expect(syncItem.status_envio).toBe('SINCRONIZADO');
      expect(syncItem.tentativas).toBe(1);

      const localTask = db.prepare('SELECT * FROM tarefas WHERE id = ?').get(task_id) as any;
      expect(localTask.sincronizada).toBe(1);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('[CT-CS03] Deve incrementar tentativas e registrar status ERRO se falhar ao upsertar um item específico', async () => {
      // Arrange: Mock SELECT 1 success, but upsert fails
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any) // SELECT 1
        .mockRejectedValueOnce(new Error('PostgreSQL syntax error'));  // Upsert fail

      const job_id = uuidv7();
      const task_id = uuidv7();
      db.prepare(`
        INSERT INTO tarefas (id, titulo, status, data_execucao, retiro_id, capataz_id, gerente_id, sincronizada)
        VALUES (?, 'Tarefa com falha', 'PENDENTE', '2026-06-25', ?, ?, ?, 0)
      `).run(task_id, RETIRO_ID, CAPATAZ_ID, GERENTE_ID);

      db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
        VALUES (?, 'tarefa', ?, 'PENDENTE', 0)
      `).run(job_id, task_id);

      // Act
      await cloudSyncService.sincronizar();

      // Assert: outbox status should transition to ERRO and tentativas incremented
      const syncItem = db.prepare('SELECT * FROM sincronizacoes WHERE id = ?').get(job_id) as any;
      expect(syncItem.status_envio).toBe('ERRO');
      expect(syncItem.tentativas).toBe(1);

      const localTask = db.prepare('SELECT * FROM tarefas WHERE id = ?').get(task_id) as any;
      expect(localTask.sincronizada).toBe(0); // stays unsynced locally
    });

    it('[CT-CS04] Deve sincronizar alertas com sucesso', async () => {
      // Arrange: Mock pool query success
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any) // SELECT 1
        .mockResolvedValueOnce({ rowCount: 1, rows: [] } as any);    // Insert query

      const job_id = uuidv7();
      const alerta_id = uuidv7();
      db.prepare(`
        INSERT INTO alertas (id, tipo, descricao, status, capataz_id, retiro_id, latitude, longitude, sincronizado)
        VALUES (?, 'cerca', 'Cerca quebrada', 'ABERTO', ?, ?, -15.7942, -47.8825, 0)
      `).run(alerta_id, CAPATAZ_ID, RETIRO_ID);

      db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
        VALUES (?, 'alerta', ?, 'PENDENTE', 0)
      `).run(job_id, alerta_id);

      // Act
      await cloudSyncService.sincronizar();

      // Assert
      const syncItem = db.prepare('SELECT * FROM sincronizacoes WHERE id = ?').get(job_id) as any;
      expect(syncItem.status_envio).toBe('SINCRONIZADO');

      const localAlerta = db.prepare('SELECT * FROM alertas WHERE id = ?').get(alerta_id) as any;
      expect(localAlerta.sincronizado).toBe(1);
    });
  });

  describe('movimentacao', () => {
    let mockClient: { query: jest.Mock; release: jest.Mock };

    beforeEach(() => {
      mockPool.connect.mockReset();
      mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        release: jest.fn(),
      };
    });

    it('[CT-CS05] Deve sincronizar movimentação com nascimento via transação com COMMIT', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any);
      mockPool.connect.mockResolvedValueOnce(mockClient);

      const job_id = uuidv7();
      const mov_id = uuidv7();
      const nas_id = uuidv7();

      db.prepare(`
        INSERT INTO movimentacoes (id, capataz_id, retiro_id, data, categoria, quantidade, sincronizado, validado, criado_em)
        VALUES (?, ?, ?, '2026-06-12', 'NASCIMENTO', 5, 0, 0, datetime('now'))
      `).run(mov_id, CAPATAZ_ID, RETIRO_ID);
      db.prepare(`INSERT INTO nascimentos (id, movimentacao_id) VALUES (?, ?)`).run(nas_id, mov_id);
      db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
        VALUES (?, 'movimentacao', ?, 'PENDENTE', 0)
      `).run(job_id, mov_id);

      await cloudSyncService.sincronizar();

      const syncItem = db.prepare('SELECT * FROM sincronizacoes WHERE id = ?').get(job_id) as any;
      expect(syncItem.status_envio).toBe('SINCRONIZADO');
      expect(syncItem.tentativas).toBe(1);
      expect((db.prepare('SELECT sincronizado FROM movimentacoes WHERE id = ?').get(mov_id) as any).sincronizado).toBe(1);

      const calls = mockClient.query.mock.calls.map((c: any[]) => c[0]);
      expect(calls[0]).toBe('BEGIN');
      expect(calls[calls.length - 1]).toBe('COMMIT');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('[CT-CS06] Deve sincronizar movimentação com óbito', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any);
      mockPool.connect.mockResolvedValueOnce(mockClient);

      const job_id = uuidv7();
      const mov_id = uuidv7();
      const ob_id = uuidv7();

      const foto_id = uuidv7();
      db.prepare(`INSERT INTO evidencias (id, tipo) VALUES (?, 'FOTO')`).run(foto_id);
      db.prepare(`
        INSERT INTO movimentacoes (id, capataz_id, retiro_id, data, categoria, quantidade, sincronizado, validado, criado_em)
        VALUES (?, ?, ?, '2026-06-12', 'OBITO', 1, 0, 0, datetime('now'))
      `).run(mov_id, CAPATAZ_ID, RETIRO_ID);
      db.prepare(`
        INSERT INTO obitos (id, movimentacao_id, identificacao_animal, causa_morte, foto_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(ob_id, mov_id, 'Boi-042', 'Doença respiratória', foto_id);
      db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
        VALUES (?, 'movimentacao', ?, 'PENDENTE', 0)
      `).run(job_id, mov_id);

      await cloudSyncService.sincronizar();

      const syncItem = db.prepare('SELECT * FROM sincronizacoes WHERE id = ?').get(job_id) as any;
      expect(syncItem.status_envio).toBe('SINCRONIZADO');
      expect((db.prepare('SELECT sincronizado FROM movimentacoes WHERE id = ?').get(mov_id) as any).sincronizado).toBe(1);

      const calls = mockClient.query.mock.calls.map((c: any[]) => c[0]);
      expect(calls[0]).toBe('BEGIN');
      expect(calls[calls.length - 1]).toBe('COMMIT');
    });

    it('[CT-CS07] Deve sincronizar movimentação com transferência', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any);
      mockPool.connect.mockResolvedValueOnce(mockClient);

      const RETIRO_DESTINO_ID = uuidv7();
      const job_id = uuidv7();
      const mov_id = uuidv7();
      const tr_id = uuidv7();

      db.prepare('INSERT INTO retiros (id, nome, localizacao, coordenador_id) VALUES (?, ?, ?, ?)').run(RETIRO_DESTINO_ID, 'Retiro Destino', 'Norte', GERENTE_ID);
      db.prepare(`
        INSERT INTO movimentacoes (id, capataz_id, retiro_id, data, categoria, quantidade, sincronizado, validado, criado_em)
        VALUES (?, ?, ?, '2026-06-12', 'TRANSFERENCIA', 10, 0, 0, datetime('now'))
      `).run(mov_id, CAPATAZ_ID, RETIRO_ID);
      db.prepare(`
        INSERT INTO transferencias (id, movimentacao_id, retiro_origem_id, retiro_destino_id)
        VALUES (?, ?, ?, ?)
      `).run(tr_id, mov_id, RETIRO_ID, RETIRO_DESTINO_ID);
      db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
        VALUES (?, 'movimentacao', ?, 'PENDENTE', 0)
      `).run(job_id, mov_id);

      await cloudSyncService.sincronizar();

      expect((db.prepare('SELECT status_envio FROM sincronizacoes WHERE id = ?').get(job_id) as any).status_envio).toBe('SINCRONIZADO');
      expect((db.prepare('SELECT sincronizado FROM movimentacoes WHERE id = ?').get(mov_id) as any).sincronizado).toBe(1);

      const calls = mockClient.query.mock.calls.map((c: any[]) => c[0]);
      expect(calls[0]).toBe('BEGIN');
      expect(calls[calls.length - 1]).toBe('COMMIT');
    });

    it('[CT-CS08] Deve sincronizar movimentação com compravenda', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any);
      mockPool.connect.mockResolvedValueOnce(mockClient);

      const job_id = uuidv7();
      const mov_id = uuidv7();
      const cv_id = uuidv7();

      db.prepare(`
        INSERT INTO movimentacoes (id, capataz_id, retiro_id, data, categoria, quantidade, sincronizado, validado, criado_em)
        VALUES (?, ?, ?, '2026-06-12', 'COMPRAVENDA', 20, 0, 0, datetime('now'))
      `).run(mov_id, CAPATAZ_ID, RETIRO_ID);
      db.prepare(`
        INSERT INTO compravendas (id, movimentacao_id, tipo_negocio, valor_financeiro)
        VALUES (?, ?, ?, ?)
      `).run(cv_id, mov_id, 'COMPRA', 150000.00);
      db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
        VALUES (?, 'movimentacao', ?, 'PENDENTE', 0)
      `).run(job_id, mov_id);

      await cloudSyncService.sincronizar();

      expect((db.prepare('SELECT status_envio FROM sincronizacoes WHERE id = ?').get(job_id) as any).status_envio).toBe('SINCRONIZADO');
      expect((db.prepare('SELECT sincronizado FROM movimentacoes WHERE id = ?').get(mov_id) as any).sincronizado).toBe(1);

      const calls = mockClient.query.mock.calls.map((c: any[]) => c[0]);
      expect(calls[0]).toBe('BEGIN');
      expect(calls[calls.length - 1]).toBe('COMMIT');
    });

    it('[CT-CS09] Deve executar ROLLBACK e marcar status ERRO quando a transação falhar', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any);
      mockClient.query
        .mockResolvedValueOnce({ rows: [] })                                       // BEGIN
        .mockRejectedValueOnce(new Error('Supabase constraint violation'));         // INSERT movimentacoes fails
      mockPool.connect.mockResolvedValueOnce(mockClient);

      const job_id = uuidv7();
      const mov_id = uuidv7();

      db.prepare(`
        INSERT INTO movimentacoes (id, capataz_id, retiro_id, data, categoria, quantidade, sincronizado, validado, criado_em)
        VALUES (?, ?, ?, '2026-06-12', 'NASCIMENTO', 3, 0, 0, datetime('now'))
      `).run(mov_id, CAPATAZ_ID, RETIRO_ID);
      db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
        VALUES (?, 'movimentacao', ?, 'PENDENTE', 0)
      `).run(job_id, mov_id);

      await cloudSyncService.sincronizar();

      const syncItem = db.prepare('SELECT * FROM sincronizacoes WHERE id = ?').get(job_id) as any;
      expect(syncItem.status_envio).toBe('ERRO');
      expect(syncItem.tentativas).toBe(1);
      expect((db.prepare('SELECT sincronizado FROM movimentacoes WHERE id = ?').get(mov_id) as any).sincronizado).toBe(0);

      const calls = mockClient.query.mock.calls.map((c: any[]) => c[0]);
      expect(calls).toContain('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('evidencia', () => {
    it('[CT-CS10] Deve sincronizar evidência vinculada a tarefa com sucesso', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any) // SELECT 1
        .mockResolvedValueOnce({ rowCount: 1, rows: [] } as any);    // upsert

      const job_id = uuidv7();
      const ev_id = uuidv7();
      const task_id = uuidv7();

      db.prepare(`
        INSERT INTO tarefas (id, titulo, status, data_execucao, retiro_id, capataz_id, gerente_id, sincronizada)
        VALUES (?, 'Tarefa Evidencia', 'PENDENTE', '2026-06-12', ?, ?, ?, 1)
      `).run(task_id, RETIRO_ID, CAPATAZ_ID, GERENTE_ID);

      db.prepare(`
        INSERT INTO evidencias (id, tarefa_id, tipo, conteudo, tamanho_bytes, sincronizada)
        VALUES (?, ?, 'FOTO', 'base64data...', 204800, 0)
      `).run(ev_id, task_id);

      db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
        VALUES (?, 'evidencia', ?, 'PENDENTE', 0)
      `).run(job_id, ev_id);

      await cloudSyncService.sincronizar();

      const syncItem = db.prepare('SELECT * FROM sincronizacoes WHERE id = ?').get(job_id) as any;
      expect(syncItem.status_envio).toBe('SINCRONIZADO');
      expect(syncItem.tentativas).toBe(1);
      expect((db.prepare('SELECT sincronizada FROM evidencias WHERE id = ?').get(ev_id) as any).sincronizada).toBe(1);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('[CT-CS11] Deve marcar ERRO e não atualizar sincronizada se o upsert falhar', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any) // SELECT 1
        .mockRejectedValueOnce(new Error('Supabase storage error'));   // upsert fails

      const job_id = uuidv7();
      const ev_id = uuidv7();

      db.prepare(`
        INSERT INTO evidencias (id, tipo, conteudo, sincronizada)
        VALUES (?, 'TEXTO', 'Anotação de campo', 0)
      `).run(ev_id);

      db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
        VALUES (?, 'evidencia', ?, 'PENDENTE', 0)
      `).run(job_id, ev_id);

      await cloudSyncService.sincronizar();

      const syncItem = db.prepare('SELECT * FROM sincronizacoes WHERE id = ?').get(job_id) as any;
      expect(syncItem.status_envio).toBe('ERRO');
      expect(syncItem.tentativas).toBe(1);
      expect((db.prepare('SELECT sincronizada FROM evidencias WHERE id = ?').get(ev_id) as any).sincronizada).toBe(0);
    });
  });

  describe('retiro', () => {
    it('[CT-CS12] Deve sincronizar retiro com sucesso', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any) // SELECT 1
        .mockResolvedValueOnce({ rowCount: 1, rows: [] } as any);    // upsert

      const job_id = uuidv7();
      db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
        VALUES (?, 'retiro', ?, 'PENDENTE', 0)
      `).run(job_id, RETIRO_ID);

      await cloudSyncService.sincronizar();

      const syncItem = db.prepare('SELECT * FROM sincronizacoes WHERE id = ?').get(job_id) as any;
      expect(syncItem.status_envio).toBe('SINCRONIZADO');
      expect(syncItem.tentativas).toBe(1);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('[CT-CS13] Deve marcar ERRO se o upsert falhar', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any) // SELECT 1
        .mockRejectedValueOnce(new Error('Supabase network error'));   // upsert fails

      const job_id = uuidv7();
      db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
        VALUES (?, 'retiro', ?, 'PENDENTE', 0)
      `).run(job_id, RETIRO_ID);

      await cloudSyncService.sincronizar();

      const syncItem = db.prepare('SELECT * FROM sincronizacoes WHERE id = ?').get(job_id) as any;
      expect(syncItem.status_envio).toBe('ERRO');
      expect(syncItem.tentativas).toBe(1);
    });
  });

  describe('usuario', () => {
    it('[CT-CS14] Deve sincronizar usuário com sucesso', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any) // SELECT 1
        .mockResolvedValueOnce({ rowCount: 1, rows: [] } as any);    // upsert

      const job_id = uuidv7();
      db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
        VALUES (?, 'usuario', ?, 'PENDENTE', 0)
      `).run(job_id, CAPATAZ_ID);

      await cloudSyncService.sincronizar();

      const syncItem = db.prepare('SELECT * FROM sincronizacoes WHERE id = ?').get(job_id) as any;
      expect(syncItem.status_envio).toBe('SINCRONIZADO');
      expect(syncItem.tentativas).toBe(1);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('[CT-CS15] Deve marcar ERRO se o upsert falhar', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any) // SELECT 1
        .mockRejectedValueOnce(new Error('Supabase network error'));   // upsert fails

      const job_id = uuidv7();
      db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
        VALUES (?, 'usuario', ?, 'PENDENTE', 0)
      `).run(job_id, GERENTE_ID);

      await cloudSyncService.sincronizar();

      const syncItem = db.prepare('SELECT * FROM sincronizacoes WHERE id = ?').get(job_id) as any;
      expect(syncItem.status_envio).toBe('ERRO');
      expect(syncItem.tentativas).toBe(1);
    });
  });
});
