import painelService from '../services/painelService';
import { AppError } from '../utils/AppError';

class PainelController {
  obterPainel(req, res, next) {
    try {
      const { gerente_id } = req.query;

      if (!gerente_id) {
        throw new AppError(400, 'Parâmetro obrigatório ausente: gerente_id (query string)');
      }

      const painel = painelService.obterPainel(gerente_id as string);
      return res.status(200).json(painel);
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

export default new PainelController();
