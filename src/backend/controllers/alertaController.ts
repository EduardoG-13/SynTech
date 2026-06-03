import alertaService from '../services/alertaService';

class AlertaController {
  async criarAlerta(req, res) {
    try {
      const { tipo, descricao, capataz_id, retiro_id, latitude, longitude } = req.body;

      if (!tipo || !capataz_id || !retiro_id || latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          erro: 'Campos obrigatórios não preenchidos: tipo, capataz_id, retiro_id, latitude, longitude'
        });
      }

      const alerta = await alertaService.criarAlerta({
        tipo,
        descricao,
        capataz_id,
        retiro_id,
        latitude,
        longitude
      });

      return res.status(201).json({
        id: alerta.id,
        mensagem: 'Alerta criado com sucesso',
        alerta
      });
    } catch (erro: any) {
      return res.status(500).json({
        erro: 'Erro ao criar alerta',
        detalhe: erro.message
      });
    }
  }

  async listarChamados(req, res) {
    try {
      const chamados = await alertaService.listarChamados(
        req.query.status as string | undefined
      );

      return res.status(200).json({ chamados });
    } catch (erro: any) {
      return res.status(500).json({
        erro: 'Erro ao listar chamados',
        detalhe: erro.message
      });
    }
  }

  async resolverChamado(req, res) {
    try {
      const { tecnico_id, solucao, foto_base64 } = req.body;

      if (!tecnico_id || !solucao || !foto_base64) {
        return res.status(400).json({
          erro: 'Campos obrigatórios não preenchidos: tecnico_id, solucao, foto_base64'
        });
      }

      const chamado = await alertaService.resolverChamado(
        req.params.id,
        tecnico_id,
        solucao,
        foto_base64
      );

      return res.status(200).json({
        mensagem: 'Chamado resolvido com sucesso',
        chamado
      });
    } catch (erro: any) {
      if (erro.message.includes('ACESSO_NEGADO')) {
        return res.status(403).json({ erro: erro.message });
      }

      if (erro.message === 'CHAMADO_NAO_ENCONTRADO') {
        return res.status(404).json({ erro: erro.message });
      }

      if (erro.message === 'CHAMADO_JA_RESOLVIDO') {
        return res.status(409).json({ erro: erro.message });
      }

      return res.status(500).json({
        erro: 'Erro ao resolver chamado',
        detalhe: erro.message
      });
    }
  }
}

export default new AlertaController();