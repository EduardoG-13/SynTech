import sincronizacaoService from '../services/sincronizacaoService';

class SincronizacaoController {
  /**
   * POST /api/sincronizacao/lote
   * Recebe um array de entidades para sincronização em lote.
   *
   * Body: { itens: [{ entidade_tipo: 'tarefa'|'alerta'|'movimentacao'|'evidencia', dados: {...} }, ...] }
   */
  async processarLote(req, res, next): Promise<void> {
    const { itens } = req.body;

    if (!itens || !Array.isArray(itens)) {
      res.status(400).json({ erro: 'Payload inválido: esperado { itens: [...] } com array de entidades' });
      return;
    }

    if (itens.length === 0) {
      res.status(400).json({ erro: 'O array de itens não pode estar vazio' });
      return;
    }

    // Limite de segurança conforme RNF-CAP: até 500 itens por ciclo
    if (itens.length > 500) {
      res.status(413).json({
        erro: 'Limite excedido: máximo de 500 itens por lote de sincronização',
        itens_recebidos: itens.length
      });
      return;
    }

    try {
      const resultado = await sincronizacaoService.processarLote(itens);

      res.status(200).json({
        mensagem: 'Lote de sincronização processado',
        ...resultado
      });
    } catch (erro) {
      next(erro);
    }
  }
}

export default new SincronizacaoController();
