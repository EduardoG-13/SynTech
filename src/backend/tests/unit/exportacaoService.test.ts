/**
 * tests/unit/exportacaoService.test.ts
 *
 * Suite de testes unitários — ExportacaoService.exportarCsv
 *
 * Regras de negócio cobertas:
 *   RF015 — Exportação de dados consolidados em CSV
 *   RN28  — Apenas Coordenadores podem exportar; dados refletem banco central
 *
 * Padrão de estruturação: AAA (Arrange · Act · Assert)
 */

jest.mock('../../repositories/exportacaoRepository', () => ({
  __esModule: true,
  default: {
    consultarMovimentacoesConsolidadas: jest.fn(),
    registrarExportacao: jest.fn(),
  },
}));

jest.mock('../../repositories/usuarioRepository', () => ({
  __esModule: true,
  default: {
    buscarPorId: jest.fn(),
  },
}));

import exportacaoRepository from '../../repositories/exportacaoRepository';
import usuarioRepository from '../../repositories/usuarioRepository';
import exportacaoService from '../../services/exportacaoService';

const mockExportacaoRepo = exportacaoRepository as jest.Mocked<typeof exportacaoRepository>;
const mockUsuarioRepo = usuarioRepository as jest.Mocked<typeof usuarioRepository>;

const COORDENADOR_ID = 'mock-coordenador-id-0001';
const CAPATAZ_ID = 'mock-capataz-id-0001';

const usuarioCoordenador = { id: COORDENADOR_ID, nome: 'Coord. Mock', perfil: 'Coordenador' };
const usuarioCapataz = { id: CAPATAZ_ID, nome: 'Capataz Mock', perfil: 'Capataz' };

const registroMock = {
  id: 'mov-001',
  data: '2026-05-25',
  retiro: 'Retiro Norte',
  tipo_evento: 'NASCIMENTO',
  categoria: 'BEZERRO',
  quantidade: 3,
  capataz_responsavel: 'João da Silva',
  criado_em: '2026-05-25T10:00:00.000Z',
};

describe('ExportacaoService — exportarCsv', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('controle de acesso', () => {
    it('deve lançar ACESSO_NEGADO quando o perfil do usuário for Capataz', () => {
      // Arrange
      (mockUsuarioRepo.buscarPorId as jest.Mock).mockReturnValue(usuarioCapataz);

      // Act & Assert
      expect(() => exportacaoService.exportarCsv(CAPATAZ_ID, {}))
        .toThrow('ACESSO_NEGADO');
      expect(mockExportacaoRepo.consultarMovimentacoesConsolidadas).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando o usuário não for encontrado', () => {
      // Arrange
      (mockUsuarioRepo.buscarPorId as jest.Mock).mockReturnValue(null);

      // Act & Assert
      expect(() => exportacaoService.exportarCsv('id-inexistente', {}))
        .toThrow('Usuário não encontrado');
      expect(mockExportacaoRepo.consultarMovimentacoesConsolidadas).not.toHaveBeenCalled();
    });
  });

  describe('formatação do CSV', () => {
    beforeEach(() => {
      (mockUsuarioRepo.buscarPorId as jest.Mock).mockReturnValue(usuarioCoordenador);
      (mockExportacaoRepo.registrarExportacao as jest.Mock).mockReturnValue('mock-exportacao-id-001');
    });

    it('deve gerar CSV com cabeçalhos separados por ponto-e-vírgula', () => {
      // Arrange
      (mockExportacaoRepo.consultarMovimentacoesConsolidadas as jest.Mock).mockReturnValue([]);

      // Act
      const resultado = exportacaoService.exportarCsv(COORDENADOR_ID, {});
      const cabecalho = resultado.csv.replace('﻿', '').split('\n')[0];
      const campos = cabecalho.split(';');

      // Assert
      expect(campos).toContain('data');
      expect(campos).toContain('tipo_evento');
      expect(campos).toContain('capataz_responsavel');
      expect(campos.length).toBeGreaterThanOrEqual(7);
    });

    it('deve retornar total_registros igual ao número de linhas consultadas', () => {
      // Arrange
      (mockExportacaoRepo.consultarMovimentacoesConsolidadas as jest.Mock).mockReturnValue(
        [registroMock, registroMock] as any
      );

      // Act
      const resultado = exportacaoService.exportarCsv(COORDENADOR_ID, {});

      // Assert
      expect(resultado.total_registros).toBe(2);
      expect(resultado.exportacao_id).toBe('mock-exportacao-id-001');
    });
  });
});
