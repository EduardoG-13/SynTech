import alertaRepository from '../repositories/alertaRepository';

class AlertaService {
  criarAlerta(dados) {
    // RN19, RN21, RN26 etc.
    if (!dados.tipo || !dados.capataz_id || !dados.retiro_id || dados.latitude === undefined || dados.longitude === undefined) {
      throw new Error('Campos obrigatórios não preenchidos: tipo, capataz_id, retiro_id, latitude, longitude');
    }

    return alertaRepository.criar(dados);
  }
}

export default new AlertaService();


