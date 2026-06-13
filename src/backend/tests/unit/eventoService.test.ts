/**
 * tests/unit/eventoService.test.ts
 *
 * Suite de testes unitários — EventoService.listarEventos
 *
 * Regras de negócio cobertas:
 *   RF014 — Listagem de eventos com filtros por retiro e tipo
 *   US11  — Coordenador visualiza movimentações por retiro e tipo de evento
 *
 * Padrão de estruturação: AAA (Arrange · Act · Assert)
 */

jest.mock('../../repositories/eventoRepository', () => ({
  __esModule: true,
  default: {
    criarNascimento: jest.fn(),
    criarObito: jest.fn(),
    listarTodos: jest.fn(),
  },
}));

import eventoRepository from '../../repositories/eventoRepository';
import eventoService from '../../services/eventoService';
import { movimentacaoFixture } from '../mocks/mockEventoRepository';

const mockEventoRepo = eventoRepository as jest.Mocked<typeof eventoRepository>;

const registroBase = {
  capataz_nome: 'Capataz Mock',
  retiro_nome: 'Retiro Mock',
  identificacao_animal: null,
  causa_morte: null,
  retiro_origem_id: null,
  retiro_destino_id: null,
  tipo_negocio: null,
  valor_financeiro: null,
};

const eventoRetiro001 = {
  ...movimentacaoFixture(),
  ...registroBase,
  retiro_id: 'retiro-001',
  tipo_evento: 'NASCIMENTO',
};

const eventoRetiro002 = {
  ...movimentacaoFixture(),
  ...registroBase,
  id: 'mock-movimentacao-id-0002',
  retiro_id: 'retiro-002',
  tipo_evento: 'OBITO',
  identificacao_animal: 'BOI-099',
  causa_morte: 'Doença respiratória',
};

const todosEventos = [eventoRetiro001, eventoRetiro002];

const paginacao = (total: number) => ({
  pagina: 1,
  limite: 20,
  total,
  total_paginas: Math.ceil(total / 20) || 0,
});

describe('EventoService — listarEventos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sem filtros', () => {
    it('deve retornar todos os eventos e repassar objeto vazio ao repositório', async () => {
      // Arrange
      mockEventoRepo.listarTodos.mockImplementation(() => ({
        registros: todosEventos,
        paginacao: paginacao(2),
      } as any));

      // Act
      const resultado = await eventoService.listarEventos({});

      // Assert
      expect(mockEventoRepo.listarTodos).toHaveBeenCalledWith({});
      expect(resultado.registros).toHaveLength(2);
    });
  });

  describe('filtro por retiro_id', () => {
    it('deve retornar apenas os eventos do retiro filtrado', async () => {
      // Arrange
      mockEventoRepo.listarTodos.mockImplementation(() => ({
        registros: [eventoRetiro001],
        paginacao: paginacao(1),
      } as any));

      // Act
      const resultado = await eventoService.listarEventos({ retiro_id: 'retiro-001' });

      // Assert
      expect(mockEventoRepo.listarTodos).toHaveBeenCalledWith({ retiro_id: 'retiro-001' });
      expect(resultado.registros).toHaveLength(1);
      expect(resultado.registros[0].retiro_id).toBe('retiro-001');
    });

    it('deve retornar lista vazia quando o retiro não possui eventos', async () => {
      // Arrange
      mockEventoRepo.listarTodos.mockImplementation(() => ({
        registros: [],
        paginacao: paginacao(0),
      }));

      // Act
      const resultado = await eventoService.listarEventos({ retiro_id: 'retiro-sem-eventos' });

      // Assert
      expect(mockEventoRepo.listarTodos).toHaveBeenCalledWith({ retiro_id: 'retiro-sem-eventos' });
      expect(resultado.registros).toHaveLength(0);
      expect(resultado.paginacao.total).toBe(0);
    });
  });

  describe('filtro por tipo', () => {
    it('deve repassar o filtro de tipo ao repositório e retornar apenas eventos do tipo solicitado', async () => {
      // Arrange
      mockEventoRepo.listarTodos.mockImplementation(() => ({
        registros: [eventoRetiro001],
        paginacao: paginacao(1),
      } as any));

      // Act
      const resultado = await eventoService.listarEventos({ tipo: 'NASCIMENTO' });

      // Assert
      expect(mockEventoRepo.listarTodos).toHaveBeenCalledWith({ tipo: 'NASCIMENTO' });
      expect(resultado.registros.every((e: any) => e.tipo_evento === 'NASCIMENTO')).toBe(true);
    });
  });
});
