import eventoRepository from '../repositories/eventoRepository';
import { MovimentacaoBase } from '../models/Movimentacao';

class EventoService {
  async registrarNascimento(dados: {
    data: string;
    retiro_id: string;
    categoria: string;
    quantidade: number;
    capataz_id: string;
    peso_nascimento?: number;
    identificacao_mae?: string;
    sexo?: string;
  }) {
    // RN27: Data de nascimento não pode ser futura
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    if (new Date(dados.data + 'T00:00:00') > hoje) {
      throw new Error('RN27: Data de nascimento não pode ser futura');
    }

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
      throw new Error('Informe a identificação do animal (identificacao_animal).');
    }
    if (!dados.causa_morte) {
      throw new Error('Informe a causa da morte (causa_morte).');
    }
    if (!dados.foto_base64) {
      throw new Error('Para registrar óbito é obrigatório anexar a Foto da carcaça.');
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
