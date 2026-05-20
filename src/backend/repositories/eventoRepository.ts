import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';

class EventoRepository {
  criarNascimento(evento) {
    const mov_id = uuidv4();
    const nas_id = uuidv4();
    
    // Inicia transação
    db.exec('BEGIN TRANSACTION');
    try {
      const stmtMov = db.prepare(`
        INSERT INTO movimentacoes (id, capataz_id, retiro_id, data, categoria, quantidade, sincronizado)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmtMov.run(
        mov_id,
        evento.capataz_id,
        evento.retiro_id,
        evento.data,
        evento.categoria,
        evento.quantidade,
        1 // online server
      );

      const stmtNas = db.prepare(`
        INSERT INTO nascimentos (id, movimentacao_id)
        VALUES (?, ?)
      `);
      stmtNas.run(nas_id, mov_id);

      db.exec('COMMIT');
      return this.buscarMovimentacaoPorId(mov_id);
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  buscarMovimentacaoPorId(id) {
    const stmt = db.prepare('SELECT * FROM movimentacoes WHERE id = ?');
    return stmt.get(id);
  }
}

export default new EventoRepository();


