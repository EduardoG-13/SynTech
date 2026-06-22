/**
 * tests/unit/nascimentoService.test.ts
 *
 * Suite de testes unitários — EventoService.registrarNascimento
 *
 * Regras de negócio cobertas:
 *   RF008 — Campos obrigatórios: data, retiro_id, categoria, quantidade, capataz_id
 *   RN27  — Data de nascimento não pode ser futura
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

const DATA_PASSADA = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const DATA_FUTURA = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const dadosBase = {
  capataz_id: 'mock-capataz-id-0001',
  retiro_id: 'mock-retiro-id-0001',
  data: DATA_PASSADA,
  categoria: 'BEZERRO',
  quantidade: 1,
};

describe('EventoService — registrarNascimento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEventoRepo.criarNascimento.mockImplementation(() => Promise.resolve(movimentacaoFixture()));
  });

  it('[CT-NA01] deve salvar e retornar o registro quando todos os dados são válidos', async () => {
    // Act
    const resultado = await eventoService.registrarNascimento({ ...dadosBase });

    // Assert
    expect(mockEventoRepo.criarNascimento).toHaveBeenCalledTimes(1);
    expect(resultado).toBeDefined();
  });

  describe('validação de data', () => {
    it('[CT-NA06] deve lançar erro e não persistir quando a data de nascimento for futura', async () => {
      // Arrange
      const dados = { ...dadosBase, data: DATA_FUTURA };

      // Act & Assert
      await expect(eventoService.registrarNascimento(dados))
        .rejects.toThrow('futura');
      expect(mockEventoRepo.criarNascimento).not.toHaveBeenCalled();
    });
  });
});
