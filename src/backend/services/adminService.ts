import bcrypt from 'bcryptjs';
import { v7 as uuidv7 } from 'uuid';
import db from '../config/database';

export class AdminService {
  private enfileirarSync(entidadeTipo: string, entidadeId: string) {
    db.prepare(
      `INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
       VALUES (?, ?, ?, 'PENDENTE', 0)`
    ).run(uuidv7(), entidadeTipo, entidadeId);
  }

  // ==================== RETIROS ====================

  public listarRetiros() {
    return db.prepare(`
      SELECT r.id, r.nome, r.numero, r.localizacao, r.coordenador_id, r.capataz_id,
             c.nome AS coordenador_nome,
             cap.nome AS capataz_nome
      FROM retiros r
      LEFT JOIN usuarios c   ON c.id = r.coordenador_id
      LEFT JOIN usuarios cap ON cap.id = r.capataz_id
      ORDER BY r.nome
    `).all();
  }

  public criarRetiro(dados: any) {
    const { nome, numero, localizacao, coordenador_id, capataz_id } = dados;
    if (!nome) throw new Error('Nome do retiro é obrigatório.');

    const id = uuidv7();
    db.prepare(
      `INSERT INTO retiros (id, nome, numero, localizacao, coordenador_id, capataz_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, nome, numero || null, localizacao || nome, coordenador_id || null, capataz_id || null);

    this.enfileirarSync('retiro', id);
    return id;
  }

  public atualizarRetiro(id: string, dados: any) {
    const { nome, numero, localizacao, coordenador_id, capataz_id } = dados;

    const existe = db.prepare('SELECT id FROM retiros WHERE id = ?').get(id);
    if (!existe) throw new Error('Retiro não encontrado.');

    db.prepare(
      `UPDATE retiros SET nome = ?, numero = ?, localizacao = ?, coordenador_id = ?, capataz_id = ?
       WHERE id = ?`
    ).run(nome, numero || null, localizacao || nome, coordenador_id || null, capataz_id || null, id);

    this.enfileirarSync('retiro', id);
  }

  public excluirRetiro(id: string) {
    const existe = db.prepare('SELECT id FROM retiros WHERE id = ?').get(id);
    if (!existe) throw new Error('Retiro não encontrado.');

    db.prepare('DELETE FROM retiros WHERE id = ?').run(id);
  }

  // ==================== USUÁRIOS ====================

  public listarUsuarios(perfil?: string) {
    if (perfil) {
      return db.prepare(
        'SELECT id, nome, perfil, retiro_id, is_admin FROM usuarios WHERE perfil = ? ORDER BY nome'
      ).all(perfil);
    }
    return db.prepare(
      'SELECT id, nome, perfil, retiro_id, is_admin FROM usuarios ORDER BY perfil, nome'
    ).all();
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

    const jaExiste = db.prepare('SELECT id FROM usuarios WHERE nome = ? AND perfil = ?').get(nome, perfil);
    if (jaExiste) throw new Error('Já existe um usuário com esse nome e perfil.');

    const adminFlag = (perfil === 'Gerente' && (is_admin === true || is_admin === 1 || is_admin === '1')) ? 1 : 0;
    const id = uuidv7();
    const senhaHash = bcrypt.hashSync(senha, 10);
    
    db.prepare(
      `INSERT INTO usuarios (id, nome, senha, perfil, retiro_id, is_admin) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, nome, senhaHash, perfil, retiro_id || null, adminFlag);

    this.enfileirarSync('usuario', id);
    return id;
  }

  public atualizarUsuario(id: string, dados: any) {
    const { nome, senha, perfil, retiro_id, is_admin } = dados;

    const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id) as any;
    if (!usuario) throw new Error('Usuário não encontrado.');

    const senhaFinal = senha ? bcrypt.hashSync(senha, 10) : usuario.senha;
    const perfilFinal = perfil || usuario.perfil;

    let adminFlag = usuario.is_admin;
    if (typeof is_admin !== 'undefined') {
      adminFlag = (perfilFinal === 'Gerente' && (is_admin === true || is_admin === 1 || is_admin === '1')) ? 1 : 0;
    }

    if (usuario.is_admin === 1 && adminFlag === 0) {
      const totalAdmins = db.prepare("SELECT COUNT(*) AS n FROM usuarios WHERE perfil = 'Gerente' AND is_admin = 1").get() as any;
      if (totalAdmins.n <= 1) {
        throw new Error('Não é possível remover o privilégio de administrador do único Gerente ADM.');
      }
    }

    db.prepare(
      `UPDATE usuarios SET nome = ?, senha = ?, perfil = ?, retiro_id = ?, is_admin = ? WHERE id = ?`
    ).run(nome || usuario.nome, senhaFinal, perfilFinal, retiro_id || null, adminFlag, id);

    this.enfileirarSync('usuario', id);
  }

  public excluirUsuario(id: string) {
    const usuario = db.prepare('SELECT perfil FROM usuarios WHERE id = ?').get(id) as any;
    if (!usuario) throw new Error('Usuário não encontrado.');

    if (usuario.perfil === 'Gerente') {
      const totalGerentes = db.prepare("SELECT COUNT(*) AS n FROM usuarios WHERE perfil = 'Gerente'").get() as any;
      if (totalGerentes.n <= 1) {
        throw new Error('Não é possível excluir o único Gerente do sistema.');
      }
    }

    db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
  }

  // ==================== EXCLUSÃO DE REGISTROS ====================

  public excluirBoleta(idOuGrupo: string) {
    const rows = db.prepare(
      `SELECT id FROM movimentacoes WHERE id = ? OR grupo_id = ?`
    ).all(idOuGrupo, idOuGrupo) as { id: string }[];

    if (rows.length === 0) throw new Error('Boleta não encontrada.');

    const deleteStmt = db.prepare('DELETE FROM movimentacoes WHERE id = ?');
    for (const r of rows) {
      deleteStmt.run(r.id);
      this.enfileirarSync('movimentacao_excluida', r.id);
    }
    return rows.length;
  }

  public excluirChamado(id: string) {
    const existe = db.prepare('SELECT id FROM alertas WHERE id = ?').get(id);
    if (!existe) throw new Error('Chamado não encontrado.');

    db.prepare('DELETE FROM alertas WHERE id = ?').run(id);
    this.enfileirarSync('chamado_excluido', id);
  }

  public excluirTarefa(id: string) {
    const tab = db.prepare('SELECT id FROM tarefas WHERE id = ?').get(id) as any;
    if (!tab) throw new Error('Tarefa não encontrada.');

    db.prepare('DELETE FROM tarefas WHERE id = ?').run(id);
    this.enfileirarSync('tarefa_excluida', id);
  }
}

export default new AdminService();
