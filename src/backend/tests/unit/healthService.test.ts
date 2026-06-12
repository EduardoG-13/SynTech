/**
 * tests/unit/healthService.test.ts
 *
 * Suite de testes unitários — HealthService
 *
 * Regras de negócio cobertas:
 *   — banco acessível → status "ok", sem campo "erro"
 *   — banco inacessível → status "erro", bancoStatus "desconectado", campo "erro" preenchido (linhas 21-22, 33)
 *
 * Padrão de estruturação: AAA (Arrange · Act · Assert)
 */

jest.mock('../../repositories/healthRepository', () => ({
  __esModule: true,
  default: {
    verificarConexao: jest.fn(),
  },
}));

import healthRepository from '../../repositories/healthRepository';
import healthService from '../../services/healthService';

const mockHealthRepo = healthRepository as jest.Mocked<typeof healthRepository>;

describe('HealthService', () => {
  describe('verificarSaude', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('[CT-HS01] deve retornar status "ok" e banco "conectado" quando o repositório não lança erro', () => {
      // Arrange
      mockHealthRepo.verificarConexao.mockReturnValue({ ok: 1 });

      // Act
      const resultado = healthService.verificarSaude();

      // Assert
      expect(resultado.status).toBe('ok');
      expect(resultado.banco).toBe('conectado');
      expect(resultado).not.toHaveProperty('erro');
      expect(mockHealthRepo.verificarConexao).toHaveBeenCalledTimes(1);
    });

    it('[CT-HS02] deve retornar status "erro" e banco "desconectado" quando o repositório lança exceção (linhas 21-22)', () => {
      // Arrange
      mockHealthRepo.verificarConexao.mockImplementation(() => {
        throw new Error('SQLITE_CANTOPEN: unable to open database file');
      });

      // Act
      const resultado = healthService.verificarSaude();

      // Assert
      expect(resultado.status).toBe('erro');
      expect(resultado.banco).toBe('desconectado');
    });

    it('[CT-HS03] deve incluir a mensagem de erro no campo "erro" quando o banco falha (linha 33)', () => {
      // Arrange
      const mensagemEsperada = 'SQLITE_CANTOPEN: unable to open database file';
      mockHealthRepo.verificarConexao.mockImplementation(() => {
        throw new Error(mensagemEsperada);
      });

      // Act
      const resultado = healthService.verificarSaude();

      // Assert
      expect(resultado).toHaveProperty('erro', mensagemEsperada);
    });

    it('[CT-HS04] deve sempre incluir timestamp e uptime no resultado', () => {
      // Arrange
      mockHealthRepo.verificarConexao.mockReturnValue({ ok: 1 });

      // Act
      const resultado = healthService.verificarSaude();

      // Assert
      expect(resultado).toHaveProperty('timestamp');
      expect(typeof resultado.timestamp).toBe('string');
      expect(resultado).toHaveProperty('uptime');
      expect(typeof resultado.uptime).toBe('number');
    });
  });
});
