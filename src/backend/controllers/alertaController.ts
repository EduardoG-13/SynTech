import alertaService from '../services/alertaService';

class AlertaController {
  async criarAlerta(req, res, next) {
    const { tipo, descricao, capataz_id, retiro_id, latitude, longitude, foto_base64, local_referencia, audio_base64 } = req.body;

    const faltando: string[] = [];
    if (!tipo) faltando.push('tipo');
    if (!capataz_id) faltando.push('capataz_id');
    if (!retiro_id) faltando.push('retiro_id');
    if (latitude === undefined || latitude === null || latitude === '') faltando.push('latitude');
    if (longitude === undefined || longitude === null || longitude === '') faltando.push('longitude');
    if (faltando.length) {
      return res.status(400).json({
        erro: 'Campos obrigatórios não preenchidos: ' + faltando.join(', '),
        recebido: { tipo, capataz_id, retiro_id, latitude, longitude },
      });
    }

    if (!descricao || descricao.trim().length <= 10) {
      return res.status(400).json({
        erro: 'RN-ALERTA: descrição deve ter mais de 10 caracteres'
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
        local_referencia,
        audio_base64,
      } as any);

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
      const sess = (req.session as any)?.usuario;
      const filtros = {
        status: req.query.status as string | undefined,
        // Se Infra logada com categoria, filtra automaticamente
        tipo: (req.query.tipo as string | undefined) || sess?.categoria,
      };
      const chamados = await alertaService.listarChamados(filtros);
      return res.status(200).json({ chamados });
    } catch (erro) {
      next(erro);
    }
  }

  async obterChamado(req, res, next) {
    try {
      // Usa buscarPorId — traz a foto anexada pelo capataz, áudio, retiro_nome, capataz_nome etc.
      const c = await alertaService.obterPorId(req.params.id);
      if (!c) return res.status(404).json({ erro: 'Chamado não encontrado.' });
      return res.json(c);
    } catch (erro) {
      next(erro);
    }
  }

  async resolverChamado(req, res, next) {
    // Aceita nomes alternativos vindos do JS antigo (descricaoSolucao, fotoBase64)
    const sess = (req.session as any)?.usuario;
    const tecnico_id = req.body.tecnico_id || sess?.id;
    const solucao = req.body.solucao || req.body.descricaoSolucao || req.body.descricao_solucao;
    const foto_base64 = req.body.foto_base64 || req.body.fotoBase64;

    if (!tecnico_id || !solucao) {
      return res.status(400).json({
        erro: 'Campos obrigatórios não preenchidos: solucao (e técnico via sessão)'
      });
    }
    // foto_base64 é OPCIONAL agora — algumas resoluções não exigem foto
    if (!foto_base64) {
      console.log('[resolverChamado] resolução sem foto:', req.params.id);
    }

    try {
      const chamado = await alertaService.resolverChamado(
        req.params.id,
        tecnico_id,
        solucao,
        foto_base64 || ''
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
