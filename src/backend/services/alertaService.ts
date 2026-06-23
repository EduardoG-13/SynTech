import alertaRepository from '../repositories/alertaRepository';
import { Alerta } from '../models/Alerta';

class AlertaService {
  async criarAlerta(dados: Partial<Alerta>) {
    if (!dados.descricao || dados.descricao.trim().length <= 10) {
      throw new Error('RN-ALERTA: descrição deve ter mais de 10 caracteres');
    }

    if (dados.latitude === undefined || dados.latitude === null ||
        dados.longitude === undefined || dados.longitude === null) {
      throw new Error('RN-ALERTA: coordenadas GPS são obrigatórias');
    }

    return await alertaRepository.criar(dados);
  }

  async listarChamados(filtros?: { status?: string; tipo?: string } | string) {
    if (typeof filtros === 'string') return await alertaRepository.listar(filtros);
    if (filtros === undefined)        return await alertaRepository.listar();
    return await alertaRepository.listar(filtros.status, filtros.tipo);
  }

  // Busca por ID com foto, capataz, retiro, técnico (via JOINs).
  // Usado pela tela de detalhe/resolver — precisa da imagem que o capataz anexou.
  async obterPorId(id: string) {
    return await alertaRepository.buscarPorId(id);
  }

  async iniciarChamado(id: string, tecnico_id: string) {
    const usuario = tecnico_id ? await alertaRepository.buscarUsuarioPorId(tecnico_id) : null;
    const perfisPermitidos = ['Tecnico', 'Infraestrutura'];

    if (!usuario && tecnico_id?.startsWith('tecnico-')) {
      // Login simplificado da Infra nao persiste no banco: aceitar pelo padrao de id.
    } else if (!usuario || !perfisPermitidos.includes(usuario.perfil)) {
      throw new Error('ACESSO_NEGADO: Apenas tÃ©cnicos da infraestrutura podem iniciar chamados');
    }

    const chamado = await alertaRepository.buscarPorId(id);
    if (!chamado) {
      throw new Error('CHAMADO_NAO_ENCONTRADO');
    }

    if (chamado.status === 'RESOLVIDO') {
      throw new Error('CHAMADO_JA_RESOLVIDO');
    }

    if (chamado.status === 'EM_ANDAMENTO') {
      return chamado;
    }

    return alertaRepository.iniciar(id, tecnico_id);
  }

  async resolverChamado(
    id: string,
    tecnico_id: string,
    solucao: string,
    foto_base64: string,
    audio_base64 = ''
  ) {
    const usuario = await alertaRepository.buscarUsuarioPorId(tecnico_id);
    // Aceita tanto 'Tecnico' (modelo antigo) quanto 'Infraestrutura' (novo perfil de sessão)
    const perfisPermitidos = ['Tecnico', 'Infraestrutura'];
    // O Capataz logado também não pode resolver, mas a Infra do login simplificado pode
    if (!usuario && tecnico_id.startsWith('tecnico-')) {
      // Login simplificado da Infra não persiste no banco — aceitar pelo padrão de id
    } else if (!usuario || !perfisPermitidos.includes(usuario.perfil)) {
      throw new Error('ACESSO_NEGADO: Apenas técnicos da infraestrutura podem resolver chamados');
    }

    const chamado = await alertaRepository.buscarPorId(id);
    if (!chamado) {
      throw new Error('CHAMADO_NAO_ENCONTRADO');
    }

    if (chamado.status === 'RESOLVIDO') {
      throw new Error('CHAMADO_JA_RESOLVIDO');
    }

    if (!solucao && !audio_base64) {
      throw new Error('DETALHAMENTO_OBRIGATORIO: informe texto ou audio para a solucao');
    }

    return alertaRepository.resolver(id, tecnico_id, solucao, foto_base64, audio_base64);
  }
}

export default new AlertaService();
