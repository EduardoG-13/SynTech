import alertaRepository from '../repositories/alertaRepository';
import { Alerta } from '../models/Alerta';

class AlertaService {
  async criarAlerta(dados: Partial<Alerta>) {
    if (!dados.descricao || dados.descricao.trim().length <= 10) {
      throw new Error('RN06: descrição deve ter mais de 10 caracteres');
    }

    if (dados.latitude === undefined || dados.latitude === null ||
        dados.longitude === undefined || dados.longitude === null) {
      throw new Error('RN06: coordenadas GPS são obrigatórias');
    }

    return await alertaRepository.criar(dados);
  }

  async listarChamados(status?: string) {
    return await alertaRepository.listar(status);
  }

  async resolverChamado(
    id: string,
    tecnico_id: string,
    solucao: string,
    foto_base64: string
  ) {
    const usuario = await alertaRepository.buscarUsuarioPorId(tecnico_id);
    if (!usuario || usuario.perfil !== 'Tecnico') {
      throw new Error('ACESSO_NEGADO: Apenas técnicos podem resolver chamados');
    }

    const chamado = await alertaRepository.buscarPorId(id);
    if (!chamado) {
      throw new Error('CHAMADO_NAO_ENCONTRADO');
    }

    if (chamado.status === 'RESOLVIDO') {
      throw new Error('CHAMADO_JA_RESOLVIDO');
    }

    return alertaRepository.resolver(id, tecnico_id, solucao, foto_base64);
  }
}

export default new AlertaService();
