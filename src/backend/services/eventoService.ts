import eventoRepository from '../repositories/eventoRepository';
import { MovimentacaoBase } from '../models/Movimentacao';

class EventoService {
  registrarNascimento(dados: Partial<MovimentacaoBase>) {
    // RN27 e outras regras de domínio
    return eventoRepository.criarNascimento(dados);
  }

  /**
   * Registra óbito de animal com validação de campos obrigatórios.
   *
   * RF009: Registro de óbito
   * RF013: Validação de campos obrigatórios (identificação, categoria, causa, data)
   * RN28: Foto obrigatória para auditoria sanitária
   */
  registrarObito(dados: {
    capataz_id: string;
    retiro_id: string;
    data: string;
    categoria: string;
    quantidade: number;
    identificacao_animal: string;
    causa_morte: string;
    foto_base64: string;
    geolocalizacao?: string;
  }) {
    // RF013: Validação de campos obrigatórios
    if (!dados.identificacao_animal) {
      throw new Error('RF013: Campo obrigatório ausente: identificacao_animal');
    }
    if (!dados.causa_morte) {
      throw new Error('RF013: Campo obrigatório ausente: causa_morte');
    }
    if (!dados.foto_base64) {
      throw new Error('RF013: Foto obrigatória para registro de óbito (evidência sanitária)');
    }
    if (!dados.data) {
      throw new Error('RF013: Campo obrigatório ausente: data');
    }
    if (!dados.categoria) {
      throw new Error('RF013: Campo obrigatório ausente: categoria');
    }

    return eventoRepository.criarObito(dados);
  }

  /**
   * Lista eventos zootécnicos com filtros e paginação.
   *
   * RF014: Disponibilizar registros no painel do Coordenador
   * US11: Coordenador visualiza movimentações por retiro e tipo
   */
  listarEventos(filtros: {
    retiro_id?: string;
    categoria?: string;
    data_inicio?: string;
    data_fim?: string;
    tipo?: string;
    pagina?: number;
    limite?: number;
  }) {
    return eventoRepository.listarTodos(filtros);
  }
}

export default new EventoService();



