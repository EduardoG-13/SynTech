/**
 * tests/unit/tarefaService.test.ts
 *
 * Suite de testes unitários — TarefaService.criarTarefa
 *
 * Regras de negócio cobertas:
 *   RN-DATA — data de agendamento não pode ser retroativa
 *   RN-DESC — descrição não pode estar em branco quando informada
 *   RN01    — capataz deve pertencer ao retiro informado (validado via mock)
 *
 * Padrão de estruturação: AAA (Arrange · Act · Assert)
 */

jest.mock('../../repositories/tarefaRepository', () => ({
  __esModule: true,
  default: {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    buscarTarefasHoje: jest.fn(),
    concluir: jest.fn(),
    salvarEvidencia: jest.fn(),
  },
}));

jest.mock('../../repositories/usuarioRepository', () => ({
  __esModule: true,
  default: {
    buscarPorId: jest.fn(),
  },
}));

import tarefaRepository from '../../repositories/tarefaRepository';
import usuarioRepository from '../../repositories/usuarioRepository';
import tarefaService from '../../services/tarefaService';
import { tarefaFixture } from '../mocks/mockTarefaRepository';

const mockTarefaRepo = tarefaRepository as jest.Mocked<typeof tarefaRepository>;
const mockUsuarioRepo = usuarioRepository as jest.Mocked<typeof usuarioRepository>;

const DATA_FUTURA = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const DATA_PASSADA = new Date(Date.now() - 86400000).toISOString().split('T')[0];

const mockCapataz = {
  id: 'mock-capataz-id-0001',
  perfil: 'Capataz',
  retiro_id: 'mock-retiro-id-0001',
};

describe('TarefaService', () => {
  describe('criarTarefa', () => {
    const dadosBase = {
      titulo: 'Inspeção de cerca',
      descricao: 'Verificar cerca do lote norte',
      data_execucao: DATA_FUTURA,
      retiro_id: 'mock-retiro-id-0001',
      capataz_id: 'mock-capataz-id-0001',
      gerente_id: 'mock-gerente-id-0001',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockUsuarioRepo.buscarPorId.mockReturnValue(mockCapataz);
      mockTarefaRepo.criar.mockResolvedValue(tarefaFixture());
    });

    it('deve criar a tarefa e retornar o registro persistido quando os dados são válidos', async () => {
      // Arrange
      const tarefaEsperada = tarefaFixture();
      mockTarefaRepo.criar.mockResolvedValue(tarefaEsperada);

      // Act
      const resultado = await tarefaService.criarTarefa({ ...dadosBase });

      // Assert
      expect(mockTarefaRepo.criar).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(tarefaEsperada);
    });

    it('deve lançar erro e não persistir quando a data de agendamento for retroativa', async () => {
      // Arrange
      const dados = { ...dadosBase, data_execucao: DATA_PASSADA };

      // Act & Assert
      await expect(tarefaService.criarTarefa(dados))
        .rejects
        .toThrow('retroativa');
      expect(mockTarefaRepo.criar).not.toHaveBeenCalled();
    });

    it('deve lançar erro e não persistir quando a descrição for fornecida em branco', async () => {
      // Arrange
      const dados = { ...dadosBase, descricao: '   ' };

      // Act & Assert
      await expect(tarefaService.criarTarefa(dados))
        .rejects
        .toThrow('branco');
      expect(mockTarefaRepo.criar).not.toHaveBeenCalled();
    });
  });
});
