/**
 * tests/outros-endpoints.test.ts
 *
 * Suite de testes de integração — Health check, Alertas (Chamados) e Eventos Zootécnicos (Nascimentos).
 * Abordagem: Black-box via HTTP (Supertest) + banco SQLite em memória.
 *
 * Pré-requisito: DB_PATH=':memory:' definido em tests/setup.ts (setupFiles).
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

// ── HE — GET /api/health (Health check) ────────────────────────────────────────

describe('HE — GET /api/health (Health check)', () => {
  test('HE1. Sucesso — retorna status 200 com informações de saúde do servidor e banco', async () => {
    const res = await request(app).get('/api/health');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('banco');
    expect(res.body.banco).toBe('conectado');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
  });
});

// ── AL — POST /api/chamados (Criar Alerta) ─────────────────────────────────────

describe('AL — POST /api/chamados (Criar Alerta)', () => {
  test('AL1. Sucesso — cria alerta com dados válidos e retorna HTTP 201', async () => {
    const res = await request(app)
      .post('/api/chamados')
      .send({
        tipo: 'cerca',
        descricao: 'Cerca de divisa quebrada',
        capataz_id: CAPATAZ_A,
        retiro_id: RETIRO_A,
        latitude: -23.5505,
        longitude: -46.6333
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.mensagem).toBe('Alerta criado com sucesso');
    expect(res.body.alerta.tipo).toBe('cerca');
    expect(res.body.alerta.status).toBe('ABERTO');
    expect(res.body.alerta.capataz_id).toBe(CAPATAZ_A);
    expect(res.body.alerta.retiro_id).toBe(RETIRO_A);

    // Assert outbox queue registration (US09 / RF011)
    const syncItem = db.prepare('SELECT * FROM sincronizacoes WHERE entidade_tipo = ? AND entidade_id = ?').get('alerta', res.body.id) as Record<string, unknown>;
    expect(syncItem).toBeDefined();
    expect(syncItem['status_envio']).toBe('PENDENTE');
  });

  test('AL2. Payload inválido — campos obrigatórios ausentes retorna HTTP 400', async () => {
    const res = await request(app)
      .post('/api/chamados')
      .send({
        tipo: 'cerca',
        descricao: 'Sem coordenadas e identificação',
        capataz_id: CAPATAZ_A
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
    expect(res.body.erro).toMatch(/Campos obrigatórios não preenchidos/);
  });
});

// ── N — POST /api/eventos-zootecnicos/nascimentos (Registrar Nascimento) ──────

describe('N — POST /api/eventos-zootecnicos/nascimentos (Registrar Nascimento)', () => {
  test('N1. Sucesso — registra nascimento animal com sucesso e retorna HTTP 201', async () => {
    const res = await request(app)
      .post('/api/eventos-zootecnicos/nascimentos')
      .send({
        data: '2026-05-25',
        retiro_id: RETIRO_A,
        categoria: 'bezerro',
        quantidade: 3,
        capataz_id: CAPATAZ_A,
        peso_nascimento: 30,
        identificacao_mae: 'VACA-MOCK',
        sexo: 'M'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.mensagem).toBe('Registro de nascimento criado com sucesso');
    expect(res.body.registro.categoria).toBe('bezerro');
    expect(res.body.registro.quantidade).toBe(3);
    expect(res.body.registro.retiro_id).toBe(RETIRO_A);
    expect(res.body.registro.capataz_id).toBe(CAPATAZ_A);

    // Assert outbox queue registration (US09 / RF011)
    const syncItem = db.prepare('SELECT * FROM sincronizacoes WHERE entidade_tipo = ? AND entidade_id = ?').get('movimentacao', res.body.id) as Record<string, unknown>;
    expect(syncItem).toBeDefined();
    expect(syncItem['status_envio']).toBe('PENDENTE');
  });

  test('N2. Payload inválido — campos obrigatórios ausentes retorna HTTP 400', async () => {
    const res = await request(app)
      .post('/api/eventos-zootecnicos/nascimentos')
      .send({
        data: '2026-05-25',
        retiro_id: RETIRO_A,
        categoria: 'bezerro'
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
    expect(res.body.erro).toMatch(/Campos obrigatórios não preenchidos/);
  });
});
