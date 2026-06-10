import request from 'supertest';
import app from '../app';
import { inicializarBanco } from '../config/initDb';
import db from '../config/database';

const RETIRO_ID  = 'retiro-sync-001';
const GERENTE_ID = 'gerente-sync-001';
const CAPATAZ_ID = 'capataz-sync-001';

beforeAll(() => {
  inicializarBanco();

  db.prepare('INSERT INTO retiros (id, nome, localizacao, coordenador_id) VALUES (?, ?, ?, ?)')
    .run(RETIRO_ID, 'Retiro Sync Intg', 'Mato Grosso', GERENTE_ID);

  db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)')
    .run(GERENTE_ID, 'Gerente Sync Intg', 'hash', 'Gerente', null);

  db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)')
    .run(CAPATAZ_ID, 'Capataz Sync Intg', 'hash', 'Capataz', RETIRO_ID);
});

// ─────────────────────────────────────────────────────────
// POST /api/sincronizacao/lote — array misto com tarefas concluídas
// ─────────────────────────────────────────────────────────
describe('POST /api/sincronizacao/lote — lote misto com tarefas concluídas', () => {
  const loteMisto = [
    {
      entidade_tipo: 'tarefa',
      dados: {
        titulo:         'Vacinação lote A',
        descricao:      'Aplicação de vacina aftosa no lote A',
        status:         'CONCLUIDA',
        data_execucao:  '2026-06-10',
        concluida_em:   '2026-06-10T14:00:00.000Z',
        retiro_id:      RETIRO_ID,
        capataz_id:     CAPATAZ_ID,
        gerente_id:     GERENTE_ID,
      },
    },
    {
      entidade_tipo: 'tarefa',
      dados: {
        titulo:         'Pesagem mensal do rebanho',
        descricao:      'Pesagem e registro de peso médio do lote B',
        status:         'CONCLUIDA',
        data_execucao:  '2026-06-10',
        concluida_em:   '2026-06-10T16:30:00.000Z',
        retiro_id:      RETIRO_ID,
        capataz_id:     CAPATAZ_ID,
        gerente_id:     GERENTE_ID,
      },
    },
    {
      entidade_tipo: 'alerta',
      dados: {
        tipo:       'INFRAESTRUTURA',
        descricao:  'Cerca danificada no setor norte do retiro',
        capataz_id: CAPATAZ_ID,
        retiro_id:  RETIRO_ID,
        latitude:   -15.7801,
        longitude:  -47.9292,
      },
    },
  ];

  it('200 — processa lote misto e retorna totais corretos (RF011)', async () => {
    const res = await request(app)
      .post('/api/sincronizacao/lote')
      .send({ itens: loteMisto });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('mensagem', 'Lote de sincronização processado');
    expect(res.body).toHaveProperty('processados', 3);
    expect(res.body).toHaveProperty('sucessos');
    expect(res.body).toHaveProperty('erros');
    expect(res.body).toHaveProperty('resultados');
    expect(Array.isArray(res.body.resultados)).toBe(true);
    expect(res.body.resultados).toHaveLength(3);
  });

  it('200 — cada resultado contém entidade_tipo e status (RF011)', async () => {
    const res = await request(app)
      .post('/api/sincronizacao/lote')
      .send({ itens: loteMisto });

    expect(res.status).toBe(200);
    for (const resultado of res.body.resultados) {
      expect(resultado).toHaveProperty('entidade_tipo');
      expect(resultado).toHaveProperty('status');
      expect(['SINCRONIZADO', 'ERRO']).toContain(resultado.status);
    }
  });

  it('200 — item com dados inválidos gera status ERRO sem derrubar o lote', async () => {
    const loteComItemInvalido = [
      {
        entidade_tipo: 'tarefa',
        dados: {
          titulo:        'Vacinação válida',
          data_execucao: '2026-06-10',
          status:        'CONCLUIDA',
          retiro_id:     RETIRO_ID,
          capataz_id:    CAPATAZ_ID,
          gerente_id:    GERENTE_ID,
        },
      },
      {
        entidade_tipo: 'tarefa',
        dados: {
          // titulo ausente — deve gerar ERRO neste item
          data_execucao: '2026-06-10',
          retiro_id:     RETIRO_ID,
          capataz_id:    CAPATAZ_ID,
          gerente_id:    GERENTE_ID,
        },
      },
    ];

    const res = await request(app)
      .post('/api/sincronizacao/lote')
      .send({ itens: loteComItemInvalido });

    expect(res.status).toBe(200);
    expect(res.body.processados).toBe(2);
    const itemComErro = res.body.resultados.find((r: any) => r.status === 'ERRO');
    expect(itemComErro).toBeDefined();
    expect(itemComErro).toHaveProperty('erro');
  });

   it('400 — sem campo itens no body', async () => {
    const res = await request(app)
      .post('/api/sincronizacao/lote')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('400 — itens não é array', async () => {
    const res = await request(app)
      .post('/api/sincronizacao/lote')
      .send({ itens: 'tarefa' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  it('400 — array de itens vazio', async () => {
    const res = await request(app)
      .post('/api/sincronizacao/lote')
      .send({ itens: [] });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

});
export {};
