import request from 'supertest';

// Mock the supabasePool before importing app
jest.mock('../config/supabasePool', () => {
  const mockPool = {
    query: jest.fn().mockResolvedValue({ rowCount: 1, rows: [] }),
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rowCount: 1, rows: [] }),
      release: jest.fn(),
    }),
  };
  return {
    __esModule: true,
    default: mockPool,
  };
});

jest.mock('../config/supabasePool', () => {
  const mockClient = {
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: jest.fn()
  };

  return {
    __esModule: true,
    default: {
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
      connect: jest.fn().mockResolvedValue(mockClient),
      end: jest.fn().mockResolvedValue(undefined)
    }
  };
});

import app from '../app';
import { inicializarBanco } from '../config/initDb';
import db from '../config/database';

const RETIRO_ID = 'retiro-rnf';
const GERENTE_ID = 'gerente-rnf';
const COORDENADOR_ID = 'coordenador-rnf';
const CAPATAZ_ID = 'capataz-rnf';
const TECNICO_ID = 'tecnico-rnf';

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

  db.prepare('INSERT INTO retiros (id, nome, localizacao, coordenador_id) VALUES (?, ?, ?, ?)').run(
    RETIRO_ID,
    'Retiro RNF',
    'MS',
    COORDENADOR_ID
  );
  db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)').run(
    GERENTE_ID,
    'Gerente RNF',
    'senha',
    'Gerente',
    null
  );
  db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)').run(
    COORDENADOR_ID,
    'Coordenador RNF',
    'senha',
    'Coordenador',
    null
  );
  db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)').run(
    CAPATAZ_ID,
    'Capataz RNF',
    'senha',
    'Capataz',
    RETIRO_ID
  );
  db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)').run(
    TECNICO_ID,
    'Tecnico Infra RNF',
    'senha',
    'Tecnico',
    null
  );
});

function inserirMovimentacao(id: string, validado: number, categoria = 'BEZERRO') {
  db.prepare(`
    INSERT INTO movimentacoes (id, capataz_id, retiro_id, data, categoria, quantidade, validado)
    VALUES (?, ?, ?, '2026-05-30', ?, 1, ?)
  `).run(id, CAPATAZ_ID, RETIRO_ID, categoria, validado);
  db.prepare('INSERT INTO nascimentos (id, movimentacao_id) VALUES (?, ?)').run(`nascimento-${id}`, id);
}

describe('RN28 - exportacao deve refletir apenas dados validados', () => {
  test('exporta apenas movimentacoes com validado = 1 e registra auditoria', async () => {
    inserirMovimentacao('mov-validada', 1, 'BEZERRO; "A"');
    inserirMovimentacao('mov-pendente', 0, 'NAO_EXPORTAR');

    const res = await request(app).get(`/api/exportacao/csv?coordenador_id=${COORDENADOR_ID}`);

    expect(res.status).toBe(200);
    expect(res.headers['x-total-registros']).toBe('1');
    expect(res.text).toContain('"BEZERRO; ""A"""');
    expect(res.text).not.toContain('NAO_EXPORTAR');
    expect(db.prepare('SELECT COUNT(*) AS total FROM exportacoes').get()).toEqual({ total: 1 });
  });

  test('impede exportacao por perfil diferente de Coordenador', async () => {
    const res = await request(app).get(`/api/exportacao/csv?coordenador_id=${GERENTE_ID}`);
    expect(res.status).toBe(403);
  });
});

describe('RNF05 - integridade dos estados de tarefa', () => {
  test('rejeita status fora do contrato no banco', () => {
    expect(() => {
      db.prepare(`
        INSERT INTO tarefas (id, titulo, status, data_execucao, retiro_id, capataz_id, gerente_id)
        VALUES ('tarefa-invalida', 'Teste', 'INVALIDO', '2026-05-30', ?, ?, ?)
      `).run(RETIRO_ID, CAPATAZ_ID, GERENTE_ID);
    }).toThrow();
  });
});

describe('RNF03 e RNF-CAP - sincronizacao em lote', () => {
  test('processa lote heterogeneo e registra resultados', async () => {
    const res = await request(app)
      .post('/api/sincronizacao/lote')
      .send({
        itens: [
          {
            entidade_tipo: 'alerta',
            dados: {
              id: 'alerta-sync',
              tipo: 'CERCA',
              capataz_id: CAPATAZ_ID,
              retiro_id: RETIRO_ID,
              latitude: -20.1,
              longitude: -56.2
            }
          },
          {
            entidade_tipo: 'movimentacao',
            dados: {
              id: 'mov-sync',
              capataz_id: CAPATAZ_ID,
              retiro_id: RETIRO_ID,
              data: '2026-05-30',
              categoria: 'BEZERRO',
              quantidade: 2
            }
          }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ processados: 2, sucessos: 2, erros: 0 });
  });

  test('rejeita lote acima do limite de 500 itens', async () => {
    const itens = Array.from({ length: 501 }, (_, indice) => ({
      entidade_tipo: 'tarefa',
      dados: { id: `tarefa-${indice}` }
    }));

    const res = await request(app).post('/api/sincronizacao/lote').send({ itens });
    expect(res.status).toBe(413);
  });
});

describe('RNF02 - desempenho da listagem principal', () => {
  test('lista tarefas do dia em ate 2 segundos com 1.000 tarefas cadastradas', async () => {
    const insert = db.prepare(`
      INSERT INTO tarefas (id, titulo, status, data_execucao, retiro_id, capataz_id, gerente_id)
      VALUES (?, ?, 'PENDENTE', ?, ?, ?, ?)
    `);
    const hoje = new Date().toISOString().split('T')[0];

    for (let indice = 0; indice < 1000; indice++) {
      insert.run(`tarefa-perf-${indice}`, `Tarefa ${indice}`, hoje, RETIRO_ID, CAPATAZ_ID, GERENTE_ID);
    }

    const inicio = performance.now();
    const res = await request(app).get(`/api/tarefas/hoje?capataz_id=${CAPATAZ_ID}`);
    const duracaoMs = performance.now() - inicio;

    expect(res.status).toBe(200);
    expect(res.body.tarefas).toHaveLength(1000);
    expect(duracaoMs).toBeLessThanOrEqual(2000);
  });
});

describe('Persona Tecnico de Infraestrutura - ciclo de resolucao de chamados', () => {
  async function criarChamado() {
    return request(app)
      .post('/api/chamados')
      .send({
        tipo: 'HIDRAULICA',
        descricao: 'Vazamento no bebedouro',
        capataz_id: CAPATAZ_ID,
        retiro_id: RETIRO_ID,
        latitude: -20.1,
        longitude: -56.2
      });
  }

  test('lista chamados para o painel da equipe de infraestrutura', async () => {
    await criarChamado();

    const res = await request(app).get('/api/chamados?status=ABERTO');

    expect(res.status).toBe(200);
    expect(res.body.chamados).toHaveLength(1);
    expect(res.body.chamados[0].status).toBe('ABERTO');
  });

  test('tecnico resolve chamado com descricao e foto de evidencia', async () => {
    const criacao = await criarChamado();

    const res = await request(app)
      .patch(`/api/chamados/${criacao.body.id}/resolver`)
      .send({
        tecnico_id: TECNICO_ID,
        solucao: 'Conexao hidraulica substituida',
        foto_base64: 'data:image/png;base64,abc'
      });

    expect(res.status).toBe(200);
    expect(res.body.mensagem).toBe('Chamado resolvido com sucesso');
    expect(res.body.chamado.status).toBe('RESOLVIDO');
    expect(res.body.chamado.tecnico_id).toBe(TECNICO_ID);
    expect(res.body.chamado.foto_id).toBeTruthy();
    expect(db.prepare('SELECT COUNT(*) AS total FROM evidencias WHERE alerta_id = ?').get(criacao.body.id)).toEqual({ total: 1 });
  });

  test('impede resolucao por usuario que nao seja tecnico', async () => {
    const criacao = await criarChamado();

    const res = await request(app)
      .patch(`/api/chamados/${criacao.body.id}/resolver`)
      .send({
        tecnico_id: CAPATAZ_ID,
        solucao: 'Tentativa indevida',
        foto_base64: 'data:image/png;base64,abc'
      });

    expect(res.status).toBe(403);
  });
});
