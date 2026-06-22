/**
 * tests/unit/obitoService.test.ts
 *
 * Suite de testes unitários — EventoService.registrarObito
 *
 * Regras de negócio cobertas:
 *   RF009 — Validação de campos obrigatórios (foto_base64, causa_morte, identificacao_animal)
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

const dadosBase = {
  capataz_id: 'mock-capataz-id-0001',
  retiro_id: 'mock-retiro-id-0001',
  data: '2026-05-25',
  categoria: 'VACA',
  quantidade: 1,
  identificacao_animal: 'BOI-042',
  causa_morte: 'Doença respiratória',
  foto_base64: 'aGVsbG8=',
};

describe('EventoService — registrarObito', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockEventoRepo.criarObito as jest.Mock).mockImplementation(() => ({
      ...movimentacaoFixture(),
      movimentacao_id: 'mock-mov-id-0001',
      obito_id: 'mock-obito-id-0001',
      foto_id: 'mock-foto-id-0001',
    }));
  });

  it('[CT-OB01] deve salvar e retornar o registro quando todos os dados são válidos', async () => {
    // Arrange — beforeEach configura criarObito com fixture válida

    // Act
    const resultado = await eventoService.registrarObito({ ...dadosBase });

    // Assert
    expect(mockEventoRepo.criarObito).toHaveBeenCalledTimes(1);
    expect(resultado).toBeDefined();
  });

  describe('validação de foto_base64 (RF009)', () => {
    it('[CT-OB02] deve lançar erro e não persistir quando foto_base64 estiver vazia', async () => {
      // Arrange
      const dados = { ...dadosBase, foto_base64: '' };

      // Act & Assert
      await expect(eventoService.registrarObito(dados))
        .rejects.toThrow(/foto da carcaça/i);
      expect(mockEventoRepo.criarObito).not.toHaveBeenCalled();
    });
  });

  describe('validação de causa_morte', () => {
    it('[CT-OB03] deve lançar erro e não persistir quando causa_morte estiver vazia', async () => {
      // Arrange
      const dados = { ...dadosBase, causa_morte: '' };

      // Act & Assert
      await expect(eventoService.registrarObito(dados))
        .rejects.toThrow(/causa da morte/i);
      expect(mockEventoRepo.criarObito).not.toHaveBeenCalled();
    });
  });

  describe('validação de identificacao_animal', () => {
    it('[CT-OB04] deve lançar erro e não persistir quando identificacao_animal estiver vazia', async () => {
      // Arrange
      const dados = { ...dadosBase, identificacao_animal: '' };

      // Act & Assert
      await expect(eventoService.registrarObito(dados))
        .rejects.toThrow(/identificação do animal/i);
      expect(mockEventoRepo.criarObito).not.toHaveBeenCalled();
    });
  });
});
