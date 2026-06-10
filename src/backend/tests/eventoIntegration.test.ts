import request from 'supertest';
import app from '../app';
import { inicializarBanco } from '../config/initDb';
import db from '../config/database';

const RETIRO_ID  = 'retiro-evento-001';
const GERENTE_ID = 'gerente-evento-001';
const CAPATAZ_ID = 'capataz-evento-001';

beforeAll(() => {
  inicializarBanco();

  db.prepare('INSERT INTO retiros (id, nome, localizacao, coordenador_id) VALUES (?, ?, ?, ?)')
    .run(RETIRO_ID, 'Retiro Evento Intg', 'Goiás', GERENTE_ID);

  db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)')
    .run(GERENTE_ID, 'Gerente Evento Intg', 'hash', 'Gerente', null);

  db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)')
    .run(CAPATAZ_ID, 'Capataz Evento Intg', 'hash', 'Capataz', RETIRO_ID);
});

// ─────────────────────────────────────────────────────────
// POST /api/eventos-zootecnicos/nascimentos
// ─────────────────────────────────────────────────────────
describe('POST /api/eventos-zootecnicos/nascimentos', () => {
  it('201 — cria nascimento com payload válido completo (RF008)', async () => {
    const res = await request(app)
      .post('/api/eventos-zootecnicos/nascimentos')
      .send({
        data:       '2026-06-10',
        retiro_id:  RETIRO_ID,
        categoria:  'BOVINO',
        quantidade: 3,
        capataz_id: CAPATAZ_ID,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('mensagem', 'Registro de nascimento criado com sucesso');
    expect(res.body).toHaveProperty('registro');
  });

  it('201 — registro retornado contém campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/eventos-zootecnicos/nascimentos')
      .send({
        data:       '2026-06-10',
        retiro_id:  RETIRO_ID,
        categoria:  'OVINO',
        quantidade: 5,
        capataz_id: CAPATAZ_ID,
      });

    expect(res.status).toBe(201);
    const registro = res.body.registro;
    expect(registro).toHaveProperty('id');
    expect(registro).toHaveProperty('retiro_id', RETIRO_ID);
    expect(registro).toHaveProperty('capataz_id', CAPATAZ_ID);
    expect(registro).toHaveProperty('categoria', 'OVINO');
    expect(registro).toHaveProperty('quantidade', 5);
  });

  it('400 — payload vazio: sem nenhum campo obrigatório', async () => {
    const res = await request(app)
      .post('/api/eventos-zootecnicos/nascimentos')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('400 — sem data', async () => {
    const res = await request(app)
      .post('/api/eventos-zootecnicos/nascimentos')
      .send({
        retiro_id:  RETIRO_ID,
        categoria:  'BOVINO',
        quantidade: 2,
        capataz_id: CAPATAZ_ID,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('400 — sem retiro_id', async () => {
    const res = await request(app)
      .post('/api/eventos-zootecnicos/nascimentos')
      .send({
        data:       '2026-06-10',
        categoria:  'BOVINO',
        quantidade: 2,
        capataz_id: CAPATAZ_ID,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('400 — sem categoria', async () => {
    const res = await request(app)
      .post('/api/eventos-zootecnicos/nascimentos')
      .send({
        data:       '2026-06-10',
        retiro_id:  RETIRO_ID,
        quantidade: 2,
        capataz_id: CAPATAZ_ID,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('400 — sem quantidade', async () => {
    const res = await request(app)
      .post('/api/eventos-zootecnicos/nascimentos')
      .send({
        data:       '2026-06-10',
        retiro_id:  RETIRO_ID,
        categoria:  'BOVINO',
        capataz_id: CAPATAZ_ID,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('400 — sem capataz_id', async () => {
    const res = await request(app)
      .post('/api/eventos-zootecnicos/nascimentos')
      .send({
        data:       '2026-06-10',
        retiro_id:  RETIRO_ID,
        categoria:  'BOVINO',
        quantidade: 2,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });
});

// ─────────────────────────────────────────────────────────
// POST /api/eventos-zootecnicos/obitos
// ─────────────────────────────────────────────────────────
const FOTO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('POST /api/eventos-zootecnicos/obitos', () => {
  it('201 — cria óbito com payload válido completo (RF009, RN07)', async () => {
    const res = await request(app)
      .post('/api/eventos-zootecnicos/obitos')
      .send({
        capataz_id:           CAPATAZ_ID,
        retiro_id:            RETIRO_ID,
        data:                 '2026-06-10',
        categoria:            'BOVINO',
        quantidade:           1,
        identificacao_animal: 'BOV-001',
        causa_morte:          'Doença respiratória',
        foto_base64:          FOTO_BASE64,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('mensagem', 'Registro de óbito criado com sucesso');
    expect(res.body).toHaveProperty('registro');
  });

  it('201 — registro retornado contém movimentacao_id e obito_id', async () => {
    const res = await request(app)
      .post('/api/eventos-zootecnicos/obitos')
      .send({
        capataz_id:           CAPATAZ_ID,
        retiro_id:            RETIRO_ID,
        data:                 '2026-06-10',
        categoria:            'OVINO',
        quantidade:           1,
        identificacao_animal: 'OVI-042',
        causa_morte:          'Intoxicação por planta',
        foto_base64:          FOTO_BASE64,
        geolocalizacao:       '-15.7801,-47.9292',
      });

    expect(res.status).toBe(201);
    const registro = res.body.registro;
    expect(registro).toHaveProperty('movimentacao_id');
    expect(registro).toHaveProperty('obito_id');
    expect(registro).toHaveProperty('foto_id');
  });
});

export {};
