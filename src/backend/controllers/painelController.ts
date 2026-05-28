import painelService from '../services/painelService';

class PainelController {
  obterPainel(req, res) {
    try {
      const { gerente_id } = req.query;

      if (!gerente_id) {
        return res.status(400).json({ erro: 'Parâmetro obrigatório ausente: gerente_id (query string)' });
      }

      const painel = painelService.obterPainel(gerente_id as string);
      return res.status(200).json(painel);
    } catch (erro) {
      if (erro.message.includes('ACESSO_NEGADO')) {
        return res.status(403).json({ erro: erro.message });
      }
      if (erro.message.includes('não encontrado')) {
        return res.status(404).json({ erro: erro.message });
      }
      return res.status(500).json({ erro: 'Erro interno do servidor', detalhe: erro.message });
    }
  }
}

export default new PainelController();
