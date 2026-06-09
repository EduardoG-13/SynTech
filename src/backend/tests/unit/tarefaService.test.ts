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
  describe('concluirTarefa', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockTarefaRepo.buscarPorId.mockResolvedValue(tarefaFixture());
      mockTarefaRepo.concluir.mockResolvedValue({
        ...tarefaFixture(),
        status: 'CONCLUIDA' as const,
        concluida_em: new Date().toISOString(),
      });
    });

    it('deve concluir a tarefa e retornar o registro atualizado quando os dados são válidos', async () => {
      // Arrange
      const tarefaConcluida = {
        ...tarefaFixture(),
        status: 'CONCLUIDA' as const,
        concluida_em: new Date().toISOString(),
      };
      mockTarefaRepo.concluir.mockResolvedValue(tarefaConcluida);

      // Act
      const resultado = await tarefaService.concluirTarefa(
        'mock-tarefa-id-0001',
        'mock-capataz-id-0001'
      );

      // Assert
      expect(mockTarefaRepo.concluir).toHaveBeenCalledTimes(1);
      expect(resultado.status).toBe('CONCLUIDA');
    });

    it('deve lançar erro e não atualizar quando a tarefa já está concluída', async () => {
      // Arrange — repositório retorna tarefa com status CONCLUIDA
      mockTarefaRepo.buscarPorId.mockResolvedValue({
        ...tarefaFixture(),
        status: 'CONCLUIDA' as const,
        concluida_em: '2026-06-01T10:00:00.000Z',
      });

      // Act & Assert
      await expect(
        tarefaService.concluirTarefa('mock-tarefa-id-0001', 'mock-capataz-id-0001')
      ).rejects.toThrow('concluída');
      expect(mockTarefaRepo.concluir).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando a tarefa não pertence ao capataz', async () => {
      // Arrange — tarefa atribuída a outro capataz (pertence a outro retiro)
      mockTarefaRepo.buscarPorId.mockResolvedValue({
        ...tarefaFixture(),
        capataz_id: 'mock-capataz-id-0002',
      });

      // Act & Assert
      await expect(
        tarefaService.concluirTarefa('mock-tarefa-id-0001', 'mock-capataz-id-0001')
      ).rejects.toThrow('capataz');
      expect(mockTarefaRepo.concluir).not.toHaveBeenCalled();
    });
  });

  describe('anexarEvidencia', () => {
    const TAREFA_ID = 'mock-tarefa-id-0001';
    const CAPATAZ_ID = 'mock-capataz-id-0001';
    const BASE64_VALIDO = 'aGVsbG8='; // "hello" em base64

    beforeEach(() => {
      jest.clearAllMocks();
      mockTarefaRepo.buscarPorId.mockResolvedValue(tarefaFixture());
      mockTarefaRepo.salvarEvidencia.mockResolvedValue('mock-evidencia-id-0001');
    });

    it('deve salvar a evidência e retornar evidencia_id quando os dados são válidos', async () => {
      // Arrange
      const dados = { tipo: 'FOTO', arquivo_base64: BASE64_VALIDO, geolocalizacao: null };

      // Act
      const resultado = await tarefaService.anexarEvidencia(TAREFA_ID, CAPATAZ_ID, dados);

      // Assert
      expect(mockTarefaRepo.salvarEvidencia).toHaveBeenCalledTimes(1);
      expect(resultado.evidencia_id).toBe('mock-evidencia-id-0001');
    });

    it('deve lançar erro e não salvar quando a tarefa não pertence ao capataz', async () => {
      // Arrange — tarefa atribuída a outro capataz
      mockTarefaRepo.buscarPorId.mockResolvedValue({
        ...tarefaFixture(),
        capataz_id: 'mock-capataz-id-0002',
      });

      // Act & Assert
      await expect(
        tarefaService.anexarEvidencia(TAREFA_ID, CAPATAZ_ID, { tipo: 'FOTO', arquivo_base64: BASE64_VALIDO })
      ).rejects.toThrow('RN05');
      expect(mockTarefaRepo.salvarEvidencia).not.toHaveBeenCalled();
    });

    it('deve lançar erro e não salvar quando arquivo_base64 excede 5 MB', async () => {
      // Arrange — string que ultrapassa 6 990 507 caracteres (limite ~5 MB binário)
      const base64GrandeValido = 'A'.repeat(6_990_508);
      const dados = { tipo: 'FOTO', arquivo_base64: base64GrandeValido, geolocalizacao: null };

      // Act & Assert
      await expect(
        tarefaService.anexarEvidencia(TAREFA_ID, CAPATAZ_ID, dados)
      ).rejects.toThrow('tamanho máximo');
      expect(mockTarefaRepo.salvarEvidencia).not.toHaveBeenCalled();
    });

    it('deve lançar erro e não salvar quando arquivo_base64 contém caracteres inválidos', async () => {
      // Arrange — string com caracteres fora do alfabeto base64
      const base64Invalido = 'não-é-base64!@#$%';
      const dados = { tipo: 'FOTO', arquivo_base64: base64Invalido, geolocalizacao: null };

      // Act & Assert
      await expect(
        tarefaService.anexarEvidencia(TAREFA_ID, CAPATAZ_ID, dados)
      ).rejects.toThrow('caracteres inválidos');
      expect(mockTarefaRepo.salvarEvidencia).not.toHaveBeenCalled();
    });

    it('deve aceitar e normalizar base64 com prefixo data URI do navegador', async () => {
      // Arrange — formato enviado pelo browser: "data:image/png;base64,<dados>"
      const dados = {
        tipo: 'FOTO',
        arquivo_base64: `data:image/png;base64,${BASE64_VALIDO}`,
        geolocalizacao: null,
      };

      // Act
      const resultado = await tarefaService.anexarEvidencia(TAREFA_ID, CAPATAZ_ID, dados);

      // Assert — prefixo removido antes de persistir
      expect(mockTarefaRepo.salvarEvidencia).toHaveBeenCalledWith(
        TAREFA_ID,
        'FOTO',
        BASE64_VALIDO,
        null
      );
      expect(resultado.evidencia_id).toBe('mock-evidencia-id-0001');
    });

    it('deve lançar erro quando arquivo_base64 é string vazia', async () => {
      // Arrange
      const dados = { tipo: 'FOTO', arquivo_base64: '', geolocalizacao: null };

      // Act & Assert
      await expect(
        tarefaService.anexarEvidencia(TAREFA_ID, CAPATAZ_ID, dados)
      ).rejects.toThrow('caracteres inválidos');
      expect(mockTarefaRepo.salvarEvidencia).not.toHaveBeenCalled();
    });

    it('deve salvar evidência de texto sem arquivo_base64', async () => {
      // Arrange — tipo TEXTO não exige arquivo_base64
      const dados = { tipo: 'TEXTO', arquivo_base64: undefined, geolocalizacao: null };

      // Act
      const resultado = await tarefaService.anexarEvidencia(TAREFA_ID, CAPATAZ_ID, dados);

      // Assert
      expect(mockTarefaRepo.salvarEvidencia).toHaveBeenCalledTimes(1);
      expect(resultado.evidencia_id).toBe('mock-evidencia-id-0001');
    });
  });

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
