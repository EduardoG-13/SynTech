import db from '../config/database';
import { v7 as uuidv7 } from 'uuid';

class AlertaRepository {
  criar(alerta) {
    const id = uuidv7();
    const stmt = db.prepare(`
      INSERT INTO alertas (id, tipo, descricao, status, capataz_id, retiro_id, latitude, longitude, sincronizado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      alerta.tipo,
      alerta.descricao || null,
      'ABERTO',
      alerta.capataz_id,
      alerta.retiro_id,
      alerta.latitude,
      alerta.longitude,
      1 // online
    );
    return this.buscarPorId(id);
  }

  buscarPorId(id) {
    const stmt = db.prepare('SELECT * FROM alertas WHERE id = ?');
    return stmt.get(id);
  }
}

export default new AlertaRepository();


