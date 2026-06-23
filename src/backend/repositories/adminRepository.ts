import db from '../config/database';
import { v7 as uuidv7 } from 'uuid';

class AdminRepository {
  public enfileirarSync(entidadeTipo: string, entidadeId: string) {
    db.prepare(
      `INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
       VALUES (?, ?, ?, 'PENDENTE', 0)`
    ).run(uuidv7(), entidadeTipo, entidadeId);
  }

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

  public criarRetiro(id: string, nome: string, numero: any, localizacao: string, coordenador_id: any, capataz_id: any) {
    db.prepare(
      `INSERT INTO retiros (id, nome, numero, localizacao, coordenador_id, capataz_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, nome, numero || null, localizacao, coordenador_id || null, capataz_id || null);
  }

  public verificarRetiroExiste(id: string) {
    return db.prepare('SELECT id FROM retiros WHERE id = ?').get(id);
  }

  public atualizarRetiro(id: string, nome: string, numero: any, localizacao: string, coordenador_id: any, capataz_id: any) {
    db.prepare(
      `UPDATE retiros SET nome = ?, numero = ?, localizacao = ?, coordenador_id = ?, capataz_id = ?
       WHERE id = ?`
    ).run(nome, numero || null, localizacao, coordenador_id || null, capataz_id || null, id);
  }

  public excluirRetiro(id: string) {
    db.prepare('DELETE FROM retiros WHERE id = ?').run(id);
  }

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

  public verificarUsuarioExistente(nome: string, perfil: string) {
    return db.prepare('SELECT id FROM usuarios WHERE nome = ? AND perfil = ?').get(nome, perfil);
  }

  public criarUsuario(id: string, nome: string, senhaHash: string, perfil: string, retiro_id: any, adminFlag: number) {
    db.prepare(
      `INSERT INTO usuarios (id, nome, senha, perfil, retiro_id, is_admin) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, nome, senhaHash, perfil, retiro_id || null, adminFlag);
  }

  public obterUsuario(id: string) {
    return db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id) as any;
  }

  public contarAdmins() {
    return (db.prepare("SELECT COUNT(*) AS n FROM usuarios WHERE perfil = 'Gerente' AND is_admin = 1").get() as any).n;
  }

  public contarGerentes() {
    return (db.prepare("SELECT COUNT(*) AS n FROM usuarios WHERE perfil = 'Gerente'").get() as any).n;
  }

  public atualizarUsuario(id: string, nome: string, senhaHash: string, perfil: string, retiro_id: any, adminFlag: number) {
    db.prepare(
      `UPDATE usuarios SET nome = ?, senha = ?, perfil = ?, retiro_id = ?, is_admin = ? WHERE id = ?`
    ).run(nome, senhaHash, perfil, retiro_id || null, adminFlag, id);
  }

  public excluirUsuario(id: string) {
    db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
  }

  public listarMovimentacoesPorIdOuGrupo(idOuGrupo: string) {
    return db.prepare(
      `SELECT id FROM movimentacoes WHERE id = ? OR grupo_id = ?`
    ).all(idOuGrupo, idOuGrupo) as { id: string }[];
  }

  public excluirMovimentacao(id: string) {
    db.prepare('DELETE FROM movimentacoes WHERE id = ?').run(id);
  }

  public verificarAlertaExiste(id: string) {
    return db.prepare('SELECT id FROM alertas WHERE id = ?').get(id);
  }

  public excluirAlerta(id: string) {
    db.prepare('DELETE FROM alertas WHERE id = ?').run(id);
  }

  public verificarTarefaExiste(id: string) {
    return db.prepare('SELECT id FROM tarefas WHERE id = ?').get(id);
  }

  public excluirTarefa(id: string) {
    db.prepare('DELETE FROM tarefas WHERE id = ?').run(id);
  }

  public listarDispositivos() {
    return db.prepare(`
      SELECT d.id, d.device_token, d.apelido, d.criado_em, d.ultimo_acesso, d.revogado_em,
             r.nome AS retiro_nome, u.nome AS capataz_nome
      FROM dispositivos d
      LEFT JOIN retiros  r ON r.id = d.retiro_id
      LEFT JOIN usuarios u ON u.id = d.capataz_id
      ORDER BY d.revogado_em IS NOT NULL, d.ultimo_acesso DESC
    `).all();
  }

  public verificarDispositivoExiste(id: string) {
    return db.prepare('SELECT id FROM dispositivos WHERE id = ?').get(id);
  }

  public revogarDispositivo(id: string) {
    db.prepare("UPDATE dispositivos SET revogado_em = datetime('now') WHERE id = ?").run(id);
  }
}

export default new AdminRepository();
