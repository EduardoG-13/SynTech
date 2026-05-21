import db from '../config/database';

class HealthRepository {
  verificarConexao() {
    const stmt = db.prepare('SELECT 1 AS ok');
    return stmt.get();
  }
}

export default new HealthRepository();
