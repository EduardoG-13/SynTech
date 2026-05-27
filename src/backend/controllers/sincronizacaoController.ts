import sincronizacaoService from '../services/sincronizacaoService';

class SincronizacaoController {
  /**
   * POST /api/sincronizacao/lote
   * Recebe um array de entidades para sincronização em lote.
   *
   * Body: { itens: [{ entidade_tipo: 'tarefa'|'alerta'|'movimentacao'|'evidencia', dados: {...} }, ...] }
   */
  processarLote(req, res) {
    try {
      const { itens } = req.body;

      if (!itens || !Array.isArray(itens)) {
        return res.status(400).json({ erro: 'Payload inválido: esperado { itens: [...] } com array de entidades' });
      }

      if (itens.length === 0) {
        return res.status(400).json({ erro: 'O array de itens não pode estar vazio' });
      }

      // Limite de segurança conforme RNF-CAP: até 500 itens por ciclo
      if (itens.length > 500) {
        return res.status(413).json({
          erro: 'Limite excedido: máximo de 500 itens por lote de sincronização',
          itens_recebidos: itens.length
        });
      }

      const resultado = sincronizacaoService.processarLote(itens);

      return res.status(200).json({
        mensagem: 'Lote de sincronização processado',
        ...resultado
      });
    } catch (erro) {
      return res.status(500).json({ erro: 'Erro ao processar lote de sincronização', detalhe: erro.message });
    }
  }
}

export default new SincronizacaoController();
