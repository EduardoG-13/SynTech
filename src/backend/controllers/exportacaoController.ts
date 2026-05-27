import exportacaoService from '../services/exportacaoService';

class ExportacaoController {
  /**
   * GET /api/exportacao/csv
   * Gera e retorna um arquivo CSV com as movimentações consolidadas.
   *
   * Query: coordenador_id (obrigatório), retiro_id, data_inicio, data_fim (opcionais)
   */
  exportarCsv(req, res) {
    try {
      const { coordenador_id, retiro_id, data_inicio, data_fim } = req.query;

      if (!coordenador_id) {
        return res.status(400).json({ erro: 'Parâmetro obrigatório ausente: coordenador_id (query string)' });
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
        return res.status(403).json({ erro: erro.message });
      }
      if (erro.message.includes('não encontrado')) {
        return res.status(404).json({ erro: erro.message });
      }
      return res.status(500).json({ erro: 'Erro ao exportar dados', detalhe: erro.message });
    }
  }
}

export default new ExportacaoController();
