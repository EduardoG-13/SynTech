import db from '../config/database';
import { v7 as uuidv7 } from 'uuid';

class TarefaRepository {
  criar(tarefa) {
    const id = uuidv7();
    const stmt = db.prepare(`
      INSERT INTO tarefas (id, titulo, descricao, status, data_execucao, retiro_id, capataz_id, gerente_id, sincronizada)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      tarefa.titulo,
      tarefa.descricao || null,
      'PENDENTE',
      tarefa.data_execucao,
      tarefa.retiro_id,
      tarefa.capataz_id,
      tarefa.gerente_id,
      1 // online server saves as synchronized directly
    );
    return this.buscarPorId(id);
  }

  buscarPorId(id) {
    const stmt = db.prepare('SELECT * FROM tarefas WHERE id = ?');
    return stmt.get(id);
  }

  buscarTarefasHoje(capataz_id, data_hoje) {
    const stmt = db.prepare('SELECT * FROM tarefas WHERE capataz_id = ? AND date(data_execucao) = date(?)');
    return stmt.all(capataz_id, data_hoje);
  }

  concluir(id, capataz_id, data_conclusao) {
    const stmt = db.prepare(`
      UPDATE tarefas 
      SET status = 'CONCLUIDA', concluida_em = ?, sincronizada = 1
      WHERE id = ? AND capataz_id = ?
    `);
    const info = stmt.run(data_conclusao, id, capataz_id);
    if (info.changes === 0) {
      return false; // Not found or not belonging to capataz
    }
    return this.buscarPorId(id);
  }

  salvarEvidencia(tarefa_id, tipo, arquivo_base64, geolocalizacao) {
    const id = uuidv7();
    const stmt = db.prepare(`
      INSERT INTO evidencias (id, tarefa_id, tipo, arquivo_base64, geolocalizacao, sincronizada)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    stmt.run(id, tarefa_id, tipo, arquivo_base64, geolocalizacao);
    return id;
  }
}

export default new TarefaRepository();


