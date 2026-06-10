import request from 'supertest';
import app from '../app';
import { inicializarBanco } from '../config/initDb';
import db from '../config/database';

const RETIRO_ID  = 'retiro-alerta-001';
const GERENTE_ID = 'gerente-alerta-001';
const CAPATAZ_ID = 'capataz-alerta-001';

beforeAll(() => {
  inicializarBanco();

  db.prepare('INSERT INTO retiros (id, nome, localizacao, coordenador_id) VALUES (?, ?, ?, ?)')
    .run(RETIRO_ID, 'Retiro Alerta Intg', 'Goiás', GERENTE_ID);

  db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)')
    .run(GERENTE_ID, 'Gerente Alerta Intg', 'hash', 'Gerente', null);

  db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)')
    .run(CAPATAZ_ID, 'Capataz Alerta Intg', 'hash', 'Capataz', RETIRO_ID);
});

// ─────────────────────────────────────────────────────────
// POST /api/chamados
// ─────────────────────────────────────────────────────────
describe('POST /api/chamados', () => {
  it('201 — cria chamado com payload válido completo (RF006)', async () => {
    const res = await request(app)
      .post('/api/chamados')
      .send({
        tipo:       'INFRAESTRUTURA',
        descricao:  'Cerca quebrada no pasto norte',
        capataz_id: CAPATAZ_ID,
        retiro_id:  RETIRO_ID,
        latitude:   -15.7801,
        longitude:  -47.9292,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('mensagem', 'Alerta criado com sucesso');
    expect(res.body).toHaveProperty('alerta');
  });

  it('201 — alerta retornado contém campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/chamados')
      .send({
        tipo:       'INFRAESTRUTURA',
        descricao:  'Porteira com ferrugem na entrada principal',
        capataz_id: CAPATAZ_ID,
        retiro_id:  RETIRO_ID,
        latitude:   -15.7801,
        longitude:  -47.9292,
      });

    expect(res.status).toBe(201);
    const alerta = res.body.alerta;
    expect(alerta).toHaveProperty('id');
    expect(alerta).toHaveProperty('tipo');
    expect(alerta).toHaveProperty('status', 'ABERTO');
    expect(alerta).toHaveProperty('capataz_id', CAPATAZ_ID);
    expect(alerta).toHaveProperty('retiro_id', RETIRO_ID);
    expect(alerta).toHaveProperty('latitude');
    expect(alerta).toHaveProperty('longitude');
  });

  it('400 — payload vazio: sem tipo, descrição nem coordenadas (RN06)', async () => {
    const res = await request(app)
      .post('/api/chamados')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('400 — sem capataz_id', async () => {
    const res = await request(app)
      .post('/api/chamados')
      .send({
        tipo:      'INFRAESTRUTURA',
        descricao: 'Cerca quebrada no pasto norte',
        retiro_id: RETIRO_ID,
        latitude:  -15.7801,
        longitude: -47.9292,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('400 — sem coordenadas GPS (RN06)', async () => {
    const res = await request(app)
      .post('/api/chamados')
      .send({
        tipo:       'INFRAESTRUTURA',
        descricao:  'Bebedouro sem água no pasto sul',
        capataz_id: CAPATAZ_ID,
        retiro_id:  RETIRO_ID,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('400 — descrição ausente com demais campos presentes (RN06)', async () => {
    const res = await request(app)
      .post('/api/chamados')
      .send({
        tipo:       'INFRAESTRUTURA',
        capataz_id: CAPATAZ_ID,
        retiro_id:  RETIRO_ID,
        latitude:   -15.7801,
        longitude:  -47.9292,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('400 — descrição com 10 caracteres ou menos (RN06)', async () => {
    const res = await request(app)
      .post('/api/chamados')
      .send({
        tipo:       'INFRAESTRUTURA',
        descricao:  'Curta',
        capataz_id: CAPATAZ_ID,
        retiro_id:  RETIRO_ID,
        latitude:   -15.7801,
        longitude:  -47.9292,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });
});
