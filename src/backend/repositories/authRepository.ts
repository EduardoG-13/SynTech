import db from '../config/database';

class AuthRepository {
  public buscarUsuarioPorNomeEPerfil(nome: string, perfil: string) {
    return db.prepare('SELECT * FROM usuarios WHERE nome = ? AND perfil = ?').get(nome, perfil) as any;
  }

  public buscarCapatazPorRetiro(retiro_id: string) {
    return db.prepare(
      `SELECT u.id, u.nome, u.perfil, u.retiro_id
       FROM usuarios u
       WHERE u.perfil = 'Capataz' AND u.retiro_id = ?`
    ).get(retiro_id) as any;
  }
}

export default new AuthRepository();
