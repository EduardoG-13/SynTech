import alertaRepository from '../repositories/alertaRepository';

class AlertaService {
  criarAlerta(dados) {
    return alertaRepository.criar(dados);
  }
}

export default new AlertaService();


