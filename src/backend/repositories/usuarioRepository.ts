import db from '../config/database';

class UsuarioRepository {
  buscarPorId(id: string) {
    const stmt = db.prepare('SELECT * FROM usuarios WHERE id = ?');
    return stmt.get(id);
  }

  buscarPorNomeEPerfil(nome: string, perfil: string) {
    const stmt = db.prepare('SELECT * FROM usuarios WHERE nome = ? AND perfil = ?');
    return stmt.get(nome, perfil);
  }

  buscarCapatazPorRetiro(retiro_id: string) {
    const stmt = db.prepare(
      `SELECT id, nome, perfil, retiro_id
       FROM usuarios
       WHERE perfil = 'Capataz' AND retiro_id = ?`
    );
    return stmt.get(retiro_id);
  }
}

export default new UsuarioRepository();
