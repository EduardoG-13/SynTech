/**
 * tests/unit/nascimentoService.test.ts
 *
 * Suite de testes unitários — EventoService.registrarNascimento
 *
 * Regras de negócio cobertas:
 *   RF008 — Validação de campos obrigatórios (peso, identificacao_mae, sexo)
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
  peso_nascimento: 35,
  identificacao_mae: 'VACA-001',
  sexo: 'F',
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

  describe('validação de peso_nascimento', () => {
    it('[CT-NA02] deve lançar erro e não persistir quando o peso for zero', async () => {
      // Arrange
      const dados = { ...dadosBase, peso_nascimento: 0 };

      // Act & Assert
      await expect(eventoService.registrarNascimento(dados))
        .rejects.toThrow('peso');
      expect(mockEventoRepo.criarNascimento).not.toHaveBeenCalled();
    });

    it('[CT-NA03] deve lançar erro e não persistir quando o peso for negativo', async () => {
      // Arrange
      const dados = { ...dadosBase, peso_nascimento: -10 };

      // Act & Assert
      await expect(eventoService.registrarNascimento(dados))
        .rejects.toThrow('peso');
      expect(mockEventoRepo.criarNascimento).not.toHaveBeenCalled();
    });
  });

  describe('validação de identificacao_mae', () => {
    it('[CT-NA04] deve lançar erro e não persistir quando identificacao_mae estiver vazia', async () => {
      // Arrange
      const dados = { ...dadosBase, identificacao_mae: '' };

      // Act & Assert
      await expect(eventoService.registrarNascimento(dados))
        .rejects.toThrow('identificacao_mae');
      expect(mockEventoRepo.criarNascimento).not.toHaveBeenCalled();
    });
  });

  describe('validação de sexo', () => {
    it('[CT-NA05] deve lançar erro e não persistir quando sexo estiver vazio', async () => {
      // Arrange
      const dados = { ...dadosBase, sexo: '' };

      // Act & Assert
      await expect(eventoService.registrarNascimento(dados))
        .rejects.toThrow('sexo');
      expect(mockEventoRepo.criarNascimento).not.toHaveBeenCalled();
    });
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
