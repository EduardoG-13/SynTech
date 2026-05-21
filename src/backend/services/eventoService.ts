import eventoRepository from '../repositories/eventoRepository';

class EventoService {
  registrarNascimento(dados) {
    // RN27
    if (!dados.data || !dados.retiro_id || !dados.categoria || !dados.quantidade || !dados.capataz_id) {
      throw new Error('Campos obrigatórios não preenchidos: data, retiro_id, categoria, quantidade, capataz_id');
    }

    return eventoRepository.criarNascimento(dados);
  }
}

export default new EventoService();


