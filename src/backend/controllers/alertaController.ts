import alertaService from '../services/alertaService';

class AlertaController {
  async criarAlerta(req, res, next) {
    const { tipo, descricao, capataz_id, retiro_id, latitude, longitude, foto_base64 } = req.body;

    if (!tipo || !capataz_id || !retiro_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        erro: 'Campos obrigatórios não preenchidos: tipo, capataz_id, retiro_id, latitude, longitude'
      });
    }

    if (!descricao || descricao.trim().length <= 10) {
      return res.status(400).json({
        erro: 'RN06: descrição deve ter mais de 10 caracteres'
      });
    }

    try {
      const alerta = await alertaService.criarAlerta({
        tipo,
        descricao,
        capataz_id,
        retiro_id,
        latitude,
        longitude,
        foto_base64,
      });

      return res.status(201).json({
        id: alerta.id,
        mensagem: 'Alerta criado com sucesso',
        alerta
      });
    } catch (erro) {
      next(erro);
    }
  }

  async listarChamados(req, res, next) {
    try {
      const chamados = await alertaService.listarChamados(
        req.query.status as string | undefined
      );

      return res.status(200).json({ chamados });
    } catch (erro) {
      next(erro);
    }
  }

  async resolverChamado(req, res, next) {
    const { tecnico_id, solucao, foto_base64 } = req.body;

    if (!tecnico_id || !solucao || !foto_base64) {
      return res.status(400).json({
        erro: 'Campos obrigatórios não preenchidos: tecnico_id, solucao, foto_base64'
      });
    }

    try {
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

      next(erro);
    }
  }
}

export default new AlertaController();
