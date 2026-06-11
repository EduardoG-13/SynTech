import eventoRepository from '../repositories/eventoRepository';
import { MovimentacaoBase } from '../models/Movimentacao';

class EventoService {
  async registrarNascimento(dados: Partial<MovimentacaoBase>) {
    // RN27 e outras regras de domínio
    return await eventoRepository.criarNascimento(dados);
  }

  /**
   * Registra óbito de animal com validação de campos obrigatórios.
   *
   * RF009: Registro de óbito
   * RF013: Validação de campos obrigatórios (identificação, categoria, causa, data)
   * RN28: Foto obrigatória para auditoria sanitária
   */
  async registrarObito(dados: {
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
    // Validação de campos obrigatórios para óbito
    if (!dados.identificacao_animal) {
      throw new Error('Informe a identificação do animal.');
    }
    if (!dados.causa_morte) {
      throw new Error('Informe a causa da morte.');
    }
    if (!dados.foto_base64) {
      throw new Error('Para registrar óbito é obrigatório anexar a foto da carcaça.');
    }
    if (!dados.data) {
      throw new Error('Informe a data do óbito.');
    }
    if (!dados.categoria) {
      throw new Error('Selecione a categoria do animal.');
    }

    return await eventoRepository.criarObito(dados);
  }

  /**
   * Lista eventos zootécnicos com filtros e paginação.
   *
   * RF014: Disponibilizar registros no painel do Coordenador
   * US11: Coordenador visualiza movimentações por retiro e tipo
   */
  async listarEventos(filtros: {
    retiro_id?: string;
    categoria?: string;
    data_inicio?: string;
    data_fim?: string;
    tipo?: string;
    pagina?: number;
    limite?: number;
  }) {
    return await eventoRepository.listarTodos(filtros);
  }
}

export default new EventoService();
