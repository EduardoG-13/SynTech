import alertaService from '../services/alertaService';

class AlertaController {
  criarAlerta(req, res) {
    try {
      const { tipo, descricao, capataz_id, retiro_id, latitude, longitude } = req.body;

      if (!tipo || !capataz_id || !retiro_id || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos: tipo, capataz_id, retiro_id, latitude, longitude' });
      }

      const alerta = alertaService.criarAlerta({
        tipo,
        descricao,
        capataz_id,
        retiro_id,
        latitude,
        longitude
      });

      return res.status(201).json({ id: alerta.id, mensagem: 'Alerta criado com sucesso', alerta });
    } catch (erro) {
      return res.status(500).json({ erro: 'Erro ao criar alerta', detalhe: erro.message });
    }
  }
}

export default new AlertaController();


