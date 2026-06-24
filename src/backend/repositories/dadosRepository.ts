import db from '../config/database';

class DadosRepository {
  public listarRetirosComLocalizacao() {
    return db.prepare('SELECT id, nome, localizacao FROM retiros ORDER BY nome').all();
  }

  public listarCapatazes() {
    return db.prepare(
      `SELECT id, nome, retiro_id FROM usuarios WHERE perfil = 'Capataz' ORDER BY nome`
    ).all();
  }

  public listarRetirosSimples() {
    return db.prepare('SELECT id, nome FROM retiros ORDER BY nome').all();
  }
}

export default new DadosRepository();
