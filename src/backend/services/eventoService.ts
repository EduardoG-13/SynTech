import eventoRepository from '../repositories/eventoRepository';
import { MovimentacaoBase } from '../models/Movimentacao';

class EventoService {
  registrarNascimento(dados: Partial<MovimentacaoBase>) {
    // RN27 e outras regras de domínio
    return eventoRepository.criarNascimento(dados);
  }
}

export default new EventoService();


