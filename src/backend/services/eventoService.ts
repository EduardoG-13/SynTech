import eventoRepository from '../repositories/eventoRepository';

class EventoService {
  registrarNascimento(dados) {
    // RN27 e outras regras de domínio
    return eventoRepository.criarNascimento(dados);
  }
}

export default new EventoService();


