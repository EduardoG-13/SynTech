import exportacaoService from '../services/exportacaoService';
import { AppError } from '../utils/AppError';

class ExportacaoController {
  /**
   * GET /api/exportacao/csv
   * Gera e retorna um arquivo CSV com as movimentações consolidadas.
   *
   * Query: coordenador_id (obrigatório), retiro_id, data_inicio, data_fim (opcionais)
   */
  exportarCsv(req, res, next) {
    try {
      const { coordenador_id, retiro_id, data_inicio, data_fim } = req.query;

      if (!coordenador_id) {
        throw new AppError(400, 'Parâmetro obrigatório ausente: coordenador_id (query string)');
      }

      const resultado = exportacaoService.exportarCsv(
        coordenador_id as string,
        {
          retiro_id: retiro_id as string | undefined,
          data_inicio: data_inicio as string | undefined,
          data_fim: data_fim as string | undefined
        }
      );

      // Configurar headers para download de arquivo CSV
      const nomeArquivo = `movimentacoes_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
      res.setHeader('X-Exportacao-Id', resultado.exportacao_id);
      res.setHeader('X-Total-Registros', resultado.total_registros.toString());

      return res.status(200).send(resultado.csv);
    } catch (erro) {
      if (erro.message.includes('ACESSO_NEGADO')) {
        return next(new AppError(403, erro.message));
      }
      if (erro.message.includes('não encontrado')) {
        return next(new AppError(404, erro.message));
      }
      next(erro);
    }
  }
}

export default new ExportacaoController();
