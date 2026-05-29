import db from '../config/database';

class UsuarioRepository {
  buscarPorId(id: string) {
    const stmt = db.prepare('SELECT * FROM usuarios WHERE id = ?');
    return stmt.get(id);
  }
}

export default new UsuarioRepository();
