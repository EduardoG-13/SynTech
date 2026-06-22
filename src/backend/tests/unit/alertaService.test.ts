/**
 * tests/unit/alertaService.test.ts
 *
 * Suite de testes unitários — AlertaService
 *
 * Regras de negócio cobertas:
 *   RN-ALERTA — chamado deve ter coordenadas GPS obrigatórias
 *   RN-TECNICO    — apenas usuários com perfil Tecnico podem resolver chamados
 *   RN-STATUS     — chamado já resolvido não pode ser resolvido novamente
 *
 * Padrão de estruturação: AAA (Arrange · Act · Assert)
 */

jest.mock('../../repositories/alertaRepository', () => ({
  __esModule: true,
  default: {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    buscarUsuarioPorId: jest.fn(),
    listar: jest.fn(),
    resolver: jest.fn(),
  },
}));

import alertaRepository from '../../repositories/alertaRepository';
import alertaService from '../../services/alertaService';
import { alertaFixture } from '../mocks/mockAlertaRepository';

const mockAlertaRepo = alertaRepository as jest.Mocked<typeof alertaRepository>;

const mockTecnico = { id: 'mock-tecnico-id-0001', perfil: 'Tecnico' };

describe('AlertaService', () => {
  describe('criarAlerta — validações de payload RN-ALERTA (RF006)', () => {
    const dadosBase = {
      tipo: 'CERCA' as const,
      descricao: 'Cerca danificada no setor B',
      capataz_id: 'mock-capataz-id-0001',
      retiro_id: 'mock-retiro-id-0001',
      latitude: -23.5505,
      longitude: -46.6333,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockAlertaRepo.criar.mockResolvedValue(alertaFixture());
    });

    it('[CT-UA01] deve criar o chamado e retornar o registro persistido quando os dados são válidos', async () => {
      // Arrange
      const alertaEsperado = alertaFixture();
      mockAlertaRepo.criar.mockResolvedValue(alertaEsperado);

      // Act
      const resultado = await alertaService.criarAlerta({ ...dadosBase });

      // Assert
      expect(mockAlertaRepo.criar).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(alertaEsperado);
    });

    it('[CT-UA05] deve lançar erro e não persistir quando a latitude estiver ausente', async () => {
      // Arrange
      const { latitude: _, ...dadosSemLat } = dadosBase;

      // Act & Assert
      await expect(alertaService.criarAlerta(dadosSemLat)).rejects.toThrow('RN-ALERTA');
      expect(mockAlertaRepo.criar).not.toHaveBeenCalled();
    });

    it('[CT-UA06] deve lançar erro e não persistir quando a longitude estiver ausente', async () => {
      // Arrange
      const { longitude: _, ...dadosSemLng } = dadosBase;

      // Act & Assert
      await expect(alertaService.criarAlerta(dadosSemLng)).rejects.toThrow('RN-ALERTA');
      expect(mockAlertaRepo.criar).not.toHaveBeenCalled();
    });
  });

  describe('resolverChamado', () => {
    const CHAMADO_ID = 'mock-alerta-id-0001';
    const TECNICO_ID = 'mock-tecnico-id-0001';
    const SOLUCAO = 'Cerca reparada com arame galvanizado.';
    const FOTO = 'aGVsbG8=';

    beforeEach(() => {
      jest.clearAllMocks();
      mockAlertaRepo.buscarUsuarioPorId.mockResolvedValue(mockTecnico);
      mockAlertaRepo.buscarPorId.mockResolvedValue(alertaFixture());
      mockAlertaRepo.resolver.mockResolvedValue({ ...alertaFixture(), status: 'RESOLVIDO' });
    });

    it('[CT-UA07] deve resolver o chamado quando os dados são válidos e o usuário é Tecnico', async () => {
      // Arrange — beforeEach configura: usuário Tecnico, chamado ABERTO, resolver.mockResolvedValue
      // Act
      const resultado = await alertaService.resolverChamado(CHAMADO_ID, TECNICO_ID, SOLUCAO, FOTO);

      // Assert
      expect(mockAlertaRepo.resolver).toHaveBeenCalledTimes(1);
      expect(resultado.status).toBe('RESOLVIDO');
    });

    it('[CT-UA08] deve lançar ACESSO_NEGADO e não resolver quando o usuário não tiver perfil Tecnico', async () => {
      // Arrange — usuário com perfil Capataz
      mockAlertaRepo.buscarUsuarioPorId.mockResolvedValue({ id: TECNICO_ID, perfil: 'Capataz' });

      // Act & Assert
      await expect(
        alertaService.resolverChamado(CHAMADO_ID, TECNICO_ID, SOLUCAO, FOTO)
      ).rejects.toThrow('ACESSO_NEGADO');
      expect(mockAlertaRepo.resolver).not.toHaveBeenCalled();
    });

    it('[CT-UA09] deve lançar ACESSO_NEGADO e não resolver quando o usuário não for encontrado', async () => {
      // Arrange
      mockAlertaRepo.buscarUsuarioPorId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        alertaService.resolverChamado(CHAMADO_ID, TECNICO_ID, SOLUCAO, FOTO)
      ).rejects.toThrow('ACESSO_NEGADO');
      expect(mockAlertaRepo.resolver).not.toHaveBeenCalled();
    });

    it('[CT-UA10] deve lançar CHAMADO_NAO_ENCONTRADO quando o chamado não existir', async () => {
      // Arrange
      mockAlertaRepo.buscarPorId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        alertaService.resolverChamado(CHAMADO_ID, TECNICO_ID, SOLUCAO, FOTO)
      ).rejects.toThrow('CHAMADO_NAO_ENCONTRADO');
      expect(mockAlertaRepo.resolver).not.toHaveBeenCalled();
    });

    it('[CT-UA11] deve lançar CHAMADO_JA_RESOLVIDO e não atualizar quando o chamado já foi resolvido', async () => {
      // Arrange — chamado com status RESOLVIDO
      mockAlertaRepo.buscarPorId.mockResolvedValue({ ...alertaFixture(), status: 'RESOLVIDO' });

      // Act & Assert
      await expect(
        alertaService.resolverChamado(CHAMADO_ID, TECNICO_ID, SOLUCAO, FOTO)
      ).rejects.toThrow('CHAMADO_JA_RESOLVIDO');
      expect(mockAlertaRepo.resolver).not.toHaveBeenCalled();
    });
  });
});
