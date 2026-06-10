import request from 'supertest';
import app from '../app';
import { inicializarBanco } from '../config/initDb';
import db from '../config/database';

const RETIRO_ID         = 'retiro-intg-001';
const GERENTE_ID        = 'gerente-intg-001';
const CAPATAZ_ID        = 'capataz-intg-001';
const TAREFA_ID         = 'tarefa-intg-001';
const TAREFA_CONCLUIR_ID = 'tarefa-intg-002';
const DATA_HOJE         = new Date().toISOString().split('T')[0];

beforeAll(() => {
  inicializarBanco();

  db.prepare('INSERT INTO retiros (id, nome, localizacao, coordenador_id) VALUES (?, ?, ?, ?)')
    .run(RETIRO_ID, 'Retiro Integração', 'Mato Grosso', GERENTE_ID);

  db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)')
    .run(GERENTE_ID, 'Gerente Integração', 'hash', 'Gerente', null);

  db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)')
    .run(CAPATAZ_ID, 'Capataz Integração', 'hash', 'Capataz', RETIRO_ID);

  db.prepare(
    `INSERT INTO tarefas (id, titulo, descricao, status, data_execucao, retiro_id, capataz_id, gerente_id, sincronizada)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(TAREFA_ID, 'Verificar bebedouros', 'Checar nível de água', 'PENDENTE', DATA_HOJE, RETIRO_ID, CAPATAZ_ID, GERENTE_ID, 0);

  db.prepare(
    `INSERT INTO tarefas (id, titulo, descricao, status, data_execucao, retiro_id, capataz_id, gerente_id, sincronizada)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(TAREFA_CONCLUIR_ID, 'Alimentar gado', null, 'PENDENTE', DATA_HOJE, RETIRO_ID, CAPATAZ_ID, GERENTE_ID, 0);
});

// ─────────────────────────────────────────────────────────
// GET /api/tarefas/hoje
// ─────────────────────────────────────────────────────────
describe('GET /api/tarefas/hoje', () => {
  it('200 — retorna body com tarefas e campo modo', async () => {
    const res = await request(app).get(`/api/tarefas/hoje?capataz_id=${CAPATAZ_ID}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tarefas)).toBe(true);
    expect(res.body.modo).toBe('online');
  });

  it('200 — cada tarefa contém os campos obrigatórios', async () => {
    const res = await request(app).get(`/api/tarefas/hoje?capataz_id=${CAPATAZ_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.tarefas.length).toBeGreaterThan(0);

    const tarefa = res.body.tarefas[0];
    expect(tarefa).toHaveProperty('id');
    expect(tarefa).toHaveProperty('titulo');
    expect(tarefa).toHaveProperty('status');
    expect(tarefa).toHaveProperty('data_execucao');
    expect(tarefa).toHaveProperty('retiro_id');
    expect(tarefa).toHaveProperty('capataz_id');
    expect(tarefa).toHaveProperty('gerente_id');
  });

  it('200 — retorna apenas tarefas do capataz logado (RN03)', async () => {
    const res = await request(app).get(`/api/tarefas/hoje?capataz_id=${CAPATAZ_ID}`);

    expect(res.status).toBe(200);
    const todas = res.body.tarefas.every((t: any) => t.capataz_id === CAPATAZ_ID);
    expect(todas).toBe(true);
  });

  it('400 — capataz_id ausente na query', async () => {
    const res = await request(app).get('/api/tarefas/hoje');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });
});

// ─────────────────────────────────────────────────────────
// PATCH /api/tarefas/:id/concluir
// ─────────────────────────────────────────────────────────
describe('PATCH /api/tarefas/:id/concluir', () => {
  it('200 — altera status para CONCLUIDA no banco', async () => {
    const res = await request(app)
      .patch(`/api/tarefas/${TAREFA_CONCLUIR_ID}/concluir`)
      .send({ capataz_id: CAPATAZ_ID });

    expect(res.status).toBe(200);
    expect(res.body.mensagem).toBe('Tarefa concluída com sucesso');

    const noDb = db.prepare('SELECT status, concluida_em FROM tarefas WHERE id = ?')
      .get(TAREFA_CONCLUIR_ID) as { status: string; concluida_em: string };

    expect(noDb.status).toBe('CONCLUIDA');
    expect(noDb.concluida_em).not.toBeNull();
  });

  it('400 — capataz_id ausente no body', async () => {
    const res = await request(app)
      .patch(`/api/tarefas/${TAREFA_CONCLUIR_ID}/concluir`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('404 — tarefa inexistente', async () => {
    const res = await request(app)
      .patch('/api/tarefas/id-que-nao-existe/concluir')
      .send({ capataz_id: CAPATAZ_ID });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('erro');
  });
});
