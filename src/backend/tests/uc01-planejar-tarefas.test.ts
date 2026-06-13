/**
 * tests/uc01-planejar-tarefas.test.ts
 *
 * Suite de testes de integração — UC01 Planejar Tarefas (US01 / RF001)
 * Abordagem: Black-box via HTTP (Supertest) + banco SQLite em memória.
 * Casos white-box: #10 (mock notificação — N/A nesta impl.) usados apenas
 * onde há conhecimento interno explícito (RN05 e retorno de tarefa_id).
 *
 * Pré-requisito: DB_PATH=':memory:' definido em tests/setup.ts (setupFiles).
 *
 * RF/RN cobertos:
 *   RF001 — Criar, buscar, concluir tarefas
 *   RN01  — Capataz deve pertencer ao retiro informado
 *   RN05  — Evidência deve pertencer à tarefa do próprio capataz
 *
 * Matriz RF → RN → Teste:
 *   RF001 / RN01  → casos 1–4 (criar)
 *   RF001         → casos 5–7 (buscar tarefas de hoje)
 *   RF001         → casos 8–10 (concluir)
 *   RF001 / RN05  → casos 11–14 (evidências)
 */

import request from 'supertest';
import app from '../app';
import { inicializarBanco } from '../config/initDb';
import db from '../config/database';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const RETIRO_A = 'retiro-a';
const RETIRO_B = 'retiro-b';
const GERENTE_ID = 'gerente-1';
const CAPATAZ_A = 'capataz-a';
const CAPATAZ_B = 'capataz-b';
const DATA_FUTURA = new Date(Date.now() + 86400000).toISOString().split('T')[0];

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(() => {
  inicializarBanco();
});

beforeEach(() => {
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

  db.prepare('INSERT INTO retiros (id, nome, localizacao, coordenador_id) VALUES (?, ?, ?, ?)').run(RETIRO_A, 'Retiro Alpha', 'SP', GERENTE_ID);
  db.prepare('INSERT INTO retiros (id, nome, localizacao, coordenador_id) VALUES (?, ?, ?, ?)').run(RETIRO_B, 'Retiro Beta', 'MG', GERENTE_ID);
  db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)').run(GERENTE_ID, 'Gerente Uno', 'senha123', 'Gerente', null);
  db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)').run(CAPATAZ_A, 'Capataz Alpha', 'senha123', 'Capataz', RETIRO_A);
  db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)').run(CAPATAZ_B, 'Capataz Beta', 'senha123', 'Capataz', RETIRO_B);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function payloadBase(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    titulo: 'Vacinação do lote A',
    retiro_id: RETIRO_A,
    capataz_id: CAPATAZ_A,
    data_execucao: DATA_FUTURA,
    gerente_id: GERENTE_ID,
    ...overrides,
  };
}

async function criarTarefa(overrides: Record<string, unknown> = {}) {
  return request(app).post('/api/tarefas').send(payloadBase(overrides));
}

// ── C — POST /api/tarefas (criar tarefa) ──────────────────────────────────────

describe('C — POST /api/tarefas (criar tarefa — UC01 / RF001)', () => {
  test('C1. Sucesso — cria tarefa com dados válidos e retorna HTTP 201', async () => {
    const res = await criarTarefa();
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.tarefa.titulo).toBe('Vacinação do lote A');
    expect(res.body.tarefa.status).toBe('PENDENTE');
  });

  test('C2. Regra de negócio — capataz não pertence ao retiro retorna HTTP 422', async () => {
    const res = await criarTarefa({ capataz_id: CAPATAZ_B });
    expect(res.status).toBe(422);
    expect(res.body.erro).toMatch(/não pertence ao retiro/i);
  });

  test('C3. Payload inválido — campos obrigatórios ausentes retorna HTTP 400', async () => {
    const res = await request(app).post('/api/tarefas').send({ titulo: 'Apenas titulo' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  test('C4. Persistência — tarefa gravada no banco com todos os campos corretos', async () => {
    const res = await criarTarefa();
    expect(res.status).toBe(201);
    const tarefa = db.prepare('SELECT * FROM tarefas WHERE id = ?').get(res.body.id) as Record<string, unknown>;
    expect(tarefa).toBeDefined();
    expect(tarefa['titulo']).toBe('Vacinação do lote A');
    expect(tarefa['retiro_id']).toBe(RETIRO_A);
    expect(tarefa['capataz_id']).toBe(CAPATAZ_A);
    expect(tarefa['gerente_id']).toBe(GERENTE_ID);
    expect(tarefa['status']).toBe('PENDENTE');

    // Assert outbox queue registration (US09 / RF011 / Outbox Pattern)
    const syncItem = db.prepare('SELECT * FROM sincronizacoes WHERE entidade_tipo = ? AND entidade_id = ?').get('tarefa', res.body.id) as Record<string, unknown>;
    expect(syncItem).toBeDefined();
    expect(syncItem['status_envio']).toBe('PENDENTE');
    expect(syncItem['tentativas']).toBe(0);
  });
});

// ── H — GET /api/tarefas/hoje (buscar tarefas do dia) ────────────────────────

describe('H — GET /api/tarefas/hoje (buscar tarefas do dia)', () => {
  test('H1. Sucesso — retorna tarefa do dia para capataz com HTTP 200', async () => {
    const hoje = new Date().toISOString().split('T')[0];
    await criarTarefa({ data_execucao: hoje });

    const res = await request(app).get(`/api/tarefas/hoje?capataz_id=${CAPATAZ_A}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tarefas');
    expect(res.body.tarefas).toHaveLength(1);
    expect(res.body.modo).toBe('online');
  });

  test('H2. Sucesso — retorna array vazio quando capataz não tem tarefas hoje', async () => {
    const res = await request(app).get(`/api/tarefas/hoje?capataz_id=${CAPATAZ_A}`);
    expect(res.status).toBe(200);
    expect(res.body.tarefas).toHaveLength(0);
  });

  test('H3. Payload inválido — capataz_id ausente retorna HTTP 400', async () => {
    const res = await request(app).get('/api/tarefas/hoje');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });
});

// ── K — PATCH /api/tarefas/:id/concluir (concluir tarefa) ───────────────────

describe('K — PATCH /api/tarefas/:id/concluir (concluir tarefa)', () => {
  test('K1. Sucesso — conclui tarefa e retorna HTTP 200 com status CONCLUIDA', async () => {
    const criacao = await criarTarefa();
    const tarefa_id = criacao.body.id as string;

    const res = await request(app)
      .patch(`/api/tarefas/${tarefa_id}/concluir`)
      .send({ capataz_id: CAPATAZ_A });

    expect(res.status).toBe(200);
    expect(res.body.tarefa.status).toBe('CONCLUIDA');
    expect(res.body).toHaveProperty('mensagem');
  });

  test('K2. Erro — concluir tarefa que não pertence ao capataz retorna HTTP 404', async () => {
    const criacao = await criarTarefa();
    const tarefa_id = criacao.body.id as string;

    const res = await request(app)
      .patch(`/api/tarefas/${tarefa_id}/concluir`)
      .send({ capataz_id: CAPATAZ_B });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('erro');
  });

  test('K3. Persistência — status e concluida_em atualizados no banco após conclusão', async () => {
    const criacao = await criarTarefa();
    const tarefa_id = criacao.body.id as string;

    await request(app)
      .patch(`/api/tarefas/${tarefa_id}/concluir`)
      .send({ capataz_id: CAPATAZ_A });

    const tarefa = db.prepare('SELECT * FROM tarefas WHERE id = ?').get(tarefa_id) as Record<string, unknown>;
    expect(tarefa['status']).toBe('CONCLUIDA');
    expect(tarefa['concluida_em']).toBeTruthy();

    // Assert outbox queue registration for completion
    const syncItems = db.prepare('SELECT * FROM sincronizacoes WHERE entidade_tipo = ? AND entidade_id = ? ORDER BY criada_em DESC').all('tarefa', tarefa_id) as Record<string, unknown>[];
    expect(syncItems.length).toBeGreaterThanOrEqual(1);
    expect(syncItems[0]['status_envio']).toBe('PENDENTE');
  });

  test('K4. Payload inválido — capataz_id ausente retorna HTTP 400', async () => {
    const criacao = await criarTarefa();
    const tarefa_id = criacao.body.id as string;

    const res = await request(app)
      .patch(`/api/tarefas/${tarefa_id}/concluir`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });
});

// ── E — POST /api/tarefas/:id/evidencias (anexar evidência — RN05) ───────────

describe('E — POST /api/tarefas/:id/evidencias (anexar evidência)', () => {
  test('E1. Sucesso — anexa evidência FOTO e retorna HTTP 201 com evidencia_id', async () => {
    const criacao = await criarTarefa();
    const tarefa_id = criacao.body.id as string;

    const res = await request(app)
      .post(`/api/tarefas/${tarefa_id}/evidencias`)
      .send({ tipo: 'FOTO', arquivo_base64: 'data:image/png;base64,abc123', capataz_id: CAPATAZ_A });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('evidencia_id');
  });

  test('E2. Regra de negócio (RN05) — tarefa não pertence ao capataz retorna HTTP 404', async () => {
    const criacao = await criarTarefa();
    const tarefa_id = criacao.body.id as string;

    const res = await request(app)
      .post(`/api/tarefas/${tarefa_id}/evidencias`)
      .send({ tipo: 'FOTO', arquivo_base64: 'data:image/png;base64,abc123', capataz_id: CAPATAZ_B });

    expect(res.status).toBe(404);
    expect(res.body.erro).toMatch(/não encontrada|não pertence/i);
  });

  test('E3. Payload inválido — tipo ausente retorna HTTP 400', async () => {
    const criacao = await criarTarefa();
    const tarefa_id = criacao.body.id as string;

    const res = await request(app)
      .post(`/api/tarefas/${tarefa_id}/evidencias`)
      .send({ arquivo_base64: 'data:image/png;base64,abc123', capataz_id: CAPATAZ_A });

    expect(res.status).toBe(400);
  });

  test('E4. Persistência — evidência TEXTO gravada no banco com tarefa_id correto', async () => {
    const criacao = await criarTarefa();
    const tarefa_id = criacao.body.id as string;

    const res = await request(app)
      .post(`/api/tarefas/${tarefa_id}/evidencias`)
      .send({ tipo: 'TEXTO', capataz_id: CAPATAZ_A });

    expect(res.status).toBe(201);
    const evidencia = db.prepare('SELECT * FROM evidencias WHERE id = ?').get(res.body.evidencia_id as string) as Record<string, unknown>;
    expect(evidencia).toBeDefined();
    expect(evidencia['tarefa_id']).toBe(tarefa_id);
    expect(evidencia['tipo']).toBe('TEXTO');

    // Assert outbox queue registration for evidence
    const syncItem = db.prepare('SELECT * FROM sincronizacoes WHERE entidade_tipo = ? AND entidade_id = ?').get('evidencia', res.body.evidencia_id as string) as Record<string, unknown>;
    expect(syncItem).toBeDefined();
    expect(syncItem['status_envio']).toBe('PENDENTE');
  });
});
