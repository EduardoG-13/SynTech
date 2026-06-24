import bcrypt from 'bcryptjs';
import { v7 as uuidv7 } from 'uuid';
import adminRepository from '../repositories/adminRepository';

export class AdminService {
  // ==================== RETIROS ====================

  public listarRetiros() {
    return adminRepository.listarRetiros();
  }

  public criarRetiro(dados: any) {
    const { nome, numero, localizacao, coordenador_id, capataz_id } = dados;
    if (!nome) throw new Error('Nome do retiro é obrigatório.');

    const id = uuidv7();
    adminRepository.criarRetiro(id, nome, numero, localizacao || nome, coordenador_id, capataz_id);
    adminRepository.enfileirarSync('retiro', id);
    return id;
  }

  public atualizarRetiro(id: string, dados: any) {
    const { nome, numero, localizacao, coordenador_id, capataz_id } = dados;

    const existe = adminRepository.verificarRetiroExiste(id);
    if (!existe) throw new Error('Retiro não encontrado.');

    adminRepository.atualizarRetiro(id, nome, numero, localizacao || nome, coordenador_id, capataz_id);
    adminRepository.enfileirarSync('retiro', id);
  }

  public excluirRetiro(id: string) {
    const existe = adminRepository.verificarRetiroExiste(id);
    if (!existe) throw new Error('Retiro não encontrado.');

    adminRepository.excluirRetiro(id);
  }

  // ==================== USUÁRIOS ====================

  public listarUsuarios(perfil?: string) {
    return adminRepository.listarUsuarios(perfil);
  }

  public criarUsuario(dados: any) {
    const { nome, senha, perfil, retiro_id, is_admin } = dados;
    if (!nome || !senha || !perfil) {
      throw new Error('Nome, senha e perfil são obrigatórios.');
    }
    const perfisValidos = ['Gerente', 'Coordenador', 'Capataz', 'Tecnico'];
    if (!perfisValidos.includes(perfil)) {
      throw new Error('Perfil inválido.');
    }

    const jaExiste = adminRepository.verificarUsuarioExistente(nome, perfil);
    if (jaExiste) throw new Error('Já existe um usuário com esse nome e perfil.');

    const adminFlag = (perfil === 'Gerente' && (is_admin === true || is_admin === 1 || is_admin === '1')) ? 1 : 0;
    const id = uuidv7();
    const senhaHash = bcrypt.hashSync(senha, 10);
    
    adminRepository.criarUsuario(id, nome, senhaHash, perfil, retiro_id, adminFlag);
    adminRepository.enfileirarSync('usuario', id);
    return id;
  }

  public atualizarUsuario(id: string, dados: any) {
    const { nome, senha, perfil, retiro_id, is_admin } = dados;

    const usuario = adminRepository.obterUsuario(id);
    if (!usuario) throw new Error('Usuário não encontrado.');

    const senhaFinal = senha ? bcrypt.hashSync(senha, 10) : usuario.senha;
    const perfilFinal = perfil || usuario.perfil;

    let adminFlag = usuario.is_admin;
    if (typeof is_admin !== 'undefined') {
      adminFlag = (perfilFinal === 'Gerente' && (is_admin === true || is_admin === 1 || is_admin === '1')) ? 1 : 0;
    }

    if (usuario.is_admin === 1 && adminFlag === 0) {
      const totalAdmins = adminRepository.contarAdmins();
      if (totalAdmins <= 1) {
        throw new Error('Não é possível remover o privilégio de administrador do único Gerente ADM.');
      }
    }

    adminRepository.atualizarUsuario(id, nome || usuario.nome, senhaFinal, perfilFinal, retiro_id, adminFlag);
    adminRepository.enfileirarSync('usuario', id);
  }

  public excluirUsuario(id: string) {
    const usuario = adminRepository.obterUsuario(id);
    if (!usuario) throw new Error('Usuário não encontrado.');

    if (usuario.perfil === 'Gerente') {
      const totalGerentes = adminRepository.contarGerentes();
      if (totalGerentes <= 1) {
        throw new Error('Não é possível excluir o único Gerente do sistema.');
      }
    }

    adminRepository.excluirUsuario(id);
  }

  // ==================== EXCLUSÃO DE REGISTROS ====================

  public excluirBoleta(idOuGrupo: string) {
    const rows = adminRepository.listarMovimentacoesPorIdOuGrupo(idOuGrupo);

    if (rows.length === 0) throw new Error('Boleta não encontrada.');

    for (const r of rows) {
      adminRepository.excluirMovimentacao(r.id);
      adminRepository.enfileirarSync('movimentacao_excluida', r.id);
    }
    return rows.length;
  }

  public excluirChamado(id: string) {
    const existe = adminRepository.verificarAlertaExiste(id);
    if (!existe) throw new Error('Chamado não encontrado.');

    adminRepository.excluirAlerta(id);
    adminRepository.enfileirarSync('chamado_excluido', id);
  }

  public excluirTarefa(id: string) {
    const tab = adminRepository.verificarTarefaExiste(id);
    if (!tab) throw new Error('Tarefa não encontrada.');

    adminRepository.excluirTarefa(id);
    adminRepository.enfileirarSync('tarefa_excluida', id);
  }
  // ==================== DISPOSITIVOS ====================

  public listarDispositivos() {
    return adminRepository.listarDispositivos();
  }

  public revogarDispositivo(id: string) {
    const existe = adminRepository.verificarDispositivoExiste(id);
    if (!existe) throw new Error('Dispositivo nÃ£o encontrado.');

    adminRepository.revogarDispositivo(id);
  }
}

export default new AdminService();
