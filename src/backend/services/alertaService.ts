import alertaRepository from '../repositories/alertaRepository';
import { Alerta } from '../models/Alerta';

class AlertaService {
  criarAlerta(dados: Partial<Alerta>) {
    return alertaRepository.criar(dados);
  }
}

export default new AlertaService();


