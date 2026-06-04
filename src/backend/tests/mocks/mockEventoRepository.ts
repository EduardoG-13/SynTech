import type { MovimentacaoBase } from '../../models/Movimentacao';

function movimentacaoFixture(): MovimentacaoBase {
  return {
    id: 'mock-movimentacao-id-0001',
    capataz_id: 'mock-capataz-id-0001',
    retiro_id: 'mock-retiro-id-0001',
    data: '2026-06-01',
    categoria: 'BEZERRO',
    quantidade: 5,
    sincronizado: 1,
    validado: 0,
    coordenador_id: null,
    criado_em: '2026-06-01T00:00:00.000Z',
  };
}

class MockEventoRepository {
  criarNascimento = jest.fn((evento: any): MovimentacaoBase => ({
    ...movimentacaoFixture(),
    capataz_id: evento.capataz_id,
    retiro_id: evento.retiro_id,
    data: evento.data,
    categoria: evento.categoria,
    quantidade: evento.quantidade,
  }));

  criarObito = jest.fn((evento: any) => ({
    ...movimentacaoFixture(),
    movimentacao_id: 'mock-movimentacao-id-0001',
    obito_id: 'mock-obito-id-0001',
    foto_id: 'mock-foto-id-0001',
    capataz_id: evento.capataz_id,
    retiro_id: evento.retiro_id,
    data: evento.data,
    categoria: evento.categoria,
    quantidade: evento.quantidade,
  }));

  listarTodos = jest.fn(
    (
      filtros: {
        retiro_id?: string;
        categoria?: string;
        data_inicio?: string;
        data_fim?: string;
        tipo?: string;
        pagina?: number;
        limite?: number;
      } = {}
    ) => ({
      registros: [
        {
          ...movimentacaoFixture(),
          capataz_nome: 'Capataz Mock',
          retiro_nome: 'Retiro Mock',
          tipo_evento: 'NASCIMENTO',
          identificacao_animal: null,
          causa_morte: null,
          retiro_origem_id: null,
          retiro_destino_id: null,
          tipo_negocio: null,
          valor_financeiro: null,
        },
      ],
      paginacao: {
        pagina: filtros.pagina ?? 1,
        limite: filtros.limite ?? 20,
        total: 1,
        total_paginas: 1,
      },
    })
  );

  buscarMovimentacaoPorId = jest.fn((id: string): MovimentacaoBase => ({
    ...movimentacaoFixture(),
    id,
  }));
}

export { MockEventoRepository, movimentacaoFixture };
export default new MockEventoRepository();
