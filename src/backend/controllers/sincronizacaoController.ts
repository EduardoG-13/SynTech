import sincronizacaoService from '../services/sincronizacaoService';
import { AppError } from '../utils/AppError';

class SincronizacaoController {
  /**
   * POST /api/sincronizacao/lote
   * Recebe um array de entidades para sincronização em lote.
   *
   * Body: { itens: [{ entidade_tipo: 'tarefa'|'alerta'|'movimentacao'|'evidencia', dados: {...} }, ...] }
   */
  async processarLote(req, res, next): Promise<void> {
    try {
      const { itens } = req.body;

      if (!itens || !Array.isArray(itens)) {
        throw new AppError(400, 'Payload inválido: esperado { itens: [...] } com array de entidades');
      }

      if (itens.length === 0) {
        throw new AppError(400, 'O array de itens não pode estar vazio');
      }

      // Limite de segurança conforme RNF-CAP: até 500 itens por ciclo
      if (itens.length > 500) {
        throw new AppError(413, 'Limite excedido: máximo de 500 itens por lote de sincronização');
      }
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
