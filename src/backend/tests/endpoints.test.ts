/**
 * Testes de integração dos endpoints do backend BrPec.
 * Usa banco de dados em memória (:memory:) para isolamento total.
 * DB_PATH é definido em jest.setup.env.ts antes da importação dos módulos.
 */

import request from 'supertest';
import app from '../app';
import { inicializarBanco } from '../config/initDb';
import db from '../config/database';

// IDs fixos para os dados de teste
const RETIRO_ID = 'retiro-test-001';
const GERENTE_ID = 'gerente-test-001';
const CAPATAZ_ID = 'capataz-test-001';
const CAPATAZ_SEM_RETIRO_ID = 'capataz-test-sem-retiro';
const TAREFA_ID = 'tarefa-test-001';
const DATA_FUTURA = new Date(Date.now() + 86400000).toISOString().split('T')[0];

beforeAll(() => {
  // Cria tabelas via migration.sql
  inicializarBanco();

  // Seed: retiro
  db.prepare(
    'INSERT INTO retiros (id, nome, localizacao, coordenador_id) VALUES (?, ?, ?, ?)'
  ).run(RETIRO_ID, 'Retiro Norte', 'Goiás, Brasil', GERENTE_ID);

  // Seed: usuários
  db.prepare(
    'INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)'
  ).run(GERENTE_ID, 'Gerente Teste', 'hash', 'Gerente', null);

  db.prepare(
    'INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)'
  ).run(CAPATAZ_ID, 'Capataz Teste', 'hash', 'Capataz', RETIRO_ID);

  db.prepare(
    'INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)'
  ).run(CAPATAZ_SEM_RETIRO_ID, 'Capataz Outro', 'hash', 'Capataz', null);

  // Seed: tarefa pré-existente para testes de concluir/evidência
  db.prepare(
    `INSERT INTO tarefas (id, titulo, status, data_execucao, retiro_id, capataz_id, gerente_id, sincronizada)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(TAREFA_ID, 'Inspecionar pasto', 'PENDENTE', '2026-05-25', RETIRO_ID, CAPATAZ_ID, GERENTE_ID, 1);
});

// ─────────────────────────────────────────────────────────
// GET /api/health
// ─────────────────────────────────────────────────────────
describe('GET /api/health', () => {
  it('retorna 200 com status do sistema', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
  });
});

// ─────────────────────────────────────────────────────────
// POST /api/tarefas
// ─────────────────────────────────────────────────────────
describe('POST /api/tarefas', () => {
  it('201 — cria tarefa com dados válidos', async () => {
    const res = await request(app)
      .post('/api/tarefas')
      .send({
        titulo: 'Verificar cercas do pasto norte',
        descricao: 'Inspeção perimetral completa',
        retiro_id: RETIRO_ID,
        capataz_id: CAPATAZ_ID,
        data_execucao: DATA_FUTURA,
        gerente_id: GERENTE_ID,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.mensagem).toBe('Tarefa criada com sucesso');
    expect(res.body.tarefa.status).toBe('PENDENTE');
  });

  it('400 — campos obrigatórios ausentes', async () => {
    const res = await request(app)
      .post('/api/tarefas')
      .send({ titulo: 'Sem campos necessários' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('422 — capataz não pertence ao retiro informado (RN01)', async () => {
    const res = await request(app)
      .post('/api/tarefas')
      .send({
        titulo: 'Tarefa inválida',
        retiro_id: RETIRO_ID,
        capataz_id: CAPATAZ_SEM_RETIRO_ID,
        data_execucao: DATA_FUTURA,
        gerente_id: GERENTE_ID,
      });

    expect(res.status).toBe(422);
    expect(res.body.erro).toMatch(/RN01/);
  });
});

// ─────────────────────────────────────────────────────────
// GET /api/tarefas/hoje
// ─────────────────────────────────────────────────────────
describe('GET /api/tarefas/hoje', () => {
  it('200 — retorna lista de tarefas do capataz para hoje', async () => {
    const res = await request(app)
      .get(`/api/tarefas/hoje?capataz_id=${CAPATAZ_ID}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tarefas)).toBe(true);
    expect(res.body.modo).toBe('online');
  });

  it('400 — capataz_id ausente', async () => {
    const res = await request(app).get('/api/tarefas/hoje');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });
});

// ─────────────────────────────────────────────────────────
// PATCH /api/tarefas/:id/concluir
// ─────────────────────────────────────────────────────────
describe('PATCH /api/tarefas/:id/concluir', () => {
  it('200 — conclui tarefa existente', async () => {
    const res = await request(app)
      .patch(`/api/tarefas/${TAREFA_ID}/concluir`)
      .send({ capataz_id: CAPATAZ_ID });

    expect(res.status).toBe(200);
    expect(res.body.mensagem).toBe('Tarefa concluída com sucesso');
    expect(res.body.tarefa.status).toBe('CONCLUIDA');
  });

  it('400 — capataz_id ausente no body', async () => {
    const res = await request(app)
      .patch(`/api/tarefas/${TAREFA_ID}/concluir`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('404 — tarefa não encontrada', async () => {
    const res = await request(app)
      .patch('/api/tarefas/id-inexistente/concluir')
      .send({ capataz_id: CAPATAZ_ID });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('erro');
  });
});

// ─────────────────────────────────────────────────────────
// POST /api/tarefas/:id/evidencias
// ─────────────────────────────────────────────────────────
describe('POST /api/tarefas/:id/evidencias', () => {
  it('201 — anexa evidência à tarefa', async () => {
    const res = await request(app)
      .post(`/api/tarefas/${TAREFA_ID}/evidencias`)
      .send({
        tipo: 'FOTO',
        arquivo_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        capataz_id: CAPATAZ_ID,
        geolocalizacao: '-15.7942,-47.8825',
      });

    expect(res.status).toBe(201);
    expect(res.body.mensagem).toBe('Evidência salva com sucesso');
    expect(res.body).toHaveProperty('evidencia_id');
  });

  it('400 — campos obrigatórios ausentes', async () => {
    const res = await request(app)
      .post(`/api/tarefas/${TAREFA_ID}/evidencias`)
      .send({ tipo: 'FOTO' }); // sem capataz_id e arquivo_base64

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('404 — tarefa inexistente (RN05)', async () => {
    const res = await request(app)
      .post('/api/tarefas/id-inexistente/evidencias')
      .send({
        tipo: 'FOTO',
        arquivo_base64: 'data:image/png;base64,abc',
        capataz_id: CAPATAZ_ID,
      });

    expect(res.status).toBe(404);
    expect(res.body.erro).toMatch(/RN05/);
  });
});

// ─────────────────────────────────────────────────────────
// POST /api/chamados
// ─────────────────────────────────────────────────────────
describe('POST /api/chamados', () => {
  it('201 — cria chamado com dados válidos', async () => {
    const res = await request(app)
      .post('/api/chamados')
      .send({
        tipo: 'ANIMAL_FERIDO',
        descricao: 'Boi com lesão na pata traseira esquerda',
        capataz_id: CAPATAZ_ID,
        retiro_id: RETIRO_ID,
        latitude: -15.7942,
        longitude: -47.8825,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.mensagem).toBe('Alerta criado com sucesso');
    expect(res.body.alerta.status).toBe('ABERTO');
  });

  it('400 — campos obrigatórios ausentes', async () => {
    const res = await request(app)
      .post('/api/chamados')
      .send({ tipo: 'ANIMAL_FERIDO' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });
});

// ─────────────────────────────────────────────────────────
// POST /api/eventos-zootecnicos/nascimentos
// ─────────────────────────────────────────────────────────
describe('POST /api/eventos-zootecnicos/nascimentos', () => {
  it('201 — registra nascimento com dados válidos', async () => {
    const res = await request(app)
      .post('/api/eventos-zootecnicos/nascimentos')
      .send({
        data: '2026-05-25',
        retiro_id: RETIRO_ID,
        categoria: 'BEZERRO',
        quantidade: 3,
        capataz_id: CAPATAZ_ID,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.mensagem).toBe('Registro de nascimento criado com sucesso');
  });

  it('400 — campos obrigatórios ausentes', async () => {
    const res = await request(app)
      .post('/api/eventos-zootecnicos/nascimentos')
      .send({ data: '2026-05-25' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });
});
