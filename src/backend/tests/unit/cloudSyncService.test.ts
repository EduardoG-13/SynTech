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
    // Clear all tables
    db.exec(`
      DELETE FROM sincronizacoes;
      DELETE FROM tarefas;
      DELETE FROM alertas;
      DELETE FROM movimentacoes;
      DELETE FROM nascimentos;
      DELETE FROM evidencias;
      DELETE FROM usuarios;
      DELETE FROM retiros;
    `);

    // Setup basic seeds
    db.prepare('INSERT INTO retiros (id, nome, localizacao, coordenador_id) VALUES (?, ?, ?, ?)').run(RETIRO_ID, 'Retiro Sinc', 'Central', GERENTE_ID);
    db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)').run(GERENTE_ID, 'Gerente Sync', 'hash', 'Gerente', null);
    db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)').run(CAPATAZ_ID, 'Capataz Sync', 'hash', 'Capataz', RETIRO_ID);

    jest.clearAllMocks();
  });

  test('Deve suspender a sincronização se não houver conexão com o Supabase (offline)', async () => {
    // Arrange: Mock pool query to throw connection error
    mockPool.query.mockRejectedValueOnce(new Error('Connection refused'));

    // Insert a pending sync job
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

  test('Deve processar e sincronizar tarefas com sucesso quando online', async () => {
    // Arrange: Mock SELECT 1 and INSERT success
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any) // SELECT 1
      .mockResolvedValueOnce({ rowCount: 1, rows: [] } as any); // Insert query

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

  test('Deve incrementar tentativas e registrar status ERRO se falhar ao upsertar um item específico', async () => {
    // Arrange: Mock SELECT 1 success, but upsert fails
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any) // SELECT 1
      .mockRejectedValueOnce(new Error('PostgreSQL syntax error')); // Upsert fail

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

  test('Deve sincronizar alertas com sucesso', async () => {
    // Arrange: Mock pool query success
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any) // SELECT 1
      .mockResolvedValueOnce({ rowCount: 1, rows: [] } as any); // Insert query

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
