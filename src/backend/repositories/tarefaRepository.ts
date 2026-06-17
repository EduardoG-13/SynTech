import db from '../config/database';
import { v7 as uuidv7 } from 'uuid';

class TarefaRepository {
  async criar(tarefa: any): Promise<any> {
    const id = uuidv7();

    db.exec('BEGIN TRANSACTION');
    try {
      const stmtInsert = db.prepare(`
        INSERT INTO tarefas (
          id, titulo, descricao, status, data_execucao,
          retiro_id, capataz_id, gerente_id, sincronizada,
          tipo_operacao, prioridade, observacoes, audio_base64, foto_base64
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
      `);
      stmtInsert.run(
        id,
        tarefa.titulo,
        tarefa.descricao || null,
        'PENDENTE',
        tarefa.data_execucao,
        tarefa.retiro_id,
        tarefa.capataz_id,
        tarefa.gerente_id,
        tarefa.tipo_operacao || null,
        tarefa.prioridade || 'media',
        tarefa.observacoes || null,
        tarefa.audio_base64 || null,
        tarefa.foto_base64 || null,
      );

      // Register outbox synchronization entry
      const stmtSync = db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas, ultima_tentativa)
        VALUES (?, 'tarefa', ?, 'PENDENTE', 0, null)
      `);
      stmtSync.run(uuidv7(), id);

      db.exec('COMMIT');

      return this.buscarPorId(id);
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  async buscarPorId(id: string): Promise<any | null> {
    const stmt = db.prepare('SELECT * FROM tarefas WHERE id = ?');
    const row = stmt.get(id);
    return row || null;
  }

  async buscarTarefasHoje(
    capataz_id: string,
    data_hoje: string
  ): Promise<any[]> {
    const stmt = db.prepare(`
      SELECT *
      FROM tarefas
      WHERE capataz_id = ?
      AND DATE(data_execucao) = DATE(?)
    `);
    return stmt.all(capataz_id, data_hoje) as any[];
  }

  async concluir(
    id: string,
    capataz_id: string,
    data_conclusao: string
  ): Promise<any | false> {
    db.exec('BEGIN TRANSACTION');
    try {
      const stmtUpdate = db.prepare(`
        UPDATE tarefas
        SET status = 'CONCLUIDA',
            concluida_em = ?,
            sincronizada = 0
        WHERE id = ?
        AND capataz_id = ?
      `);
      const info = stmtUpdate.run(data_conclusao, id, capataz_id);

      // info.changes represents rows affected in SQLite DatabaseSync
      if ((info as any).changes === 0) {
        db.exec('ROLLBACK');
        return false;
      }

      // Register outbox update in sync queue
      const stmtSync = db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas, ultima_tentativa)
        VALUES (?, 'tarefa', ?, 'PENDENTE', 0, null)
      `);
      stmtSync.run(uuidv7(), id);

      db.exec('COMMIT');
      return this.buscarPorId(id);
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  async salvarEvidencia(
    tarefa_id: string,
    tipo: string,
    arquivo_base64: string,
    geolocalizacao: string
  ): Promise<string> {
    const id = uuidv7();

    db.exec('BEGIN TRANSACTION');
    try {
      const stmtInsert = db.prepare(`
        INSERT INTO evidencias (
          id, tarefa_id, tipo, arquivo_base64, geolocalizacao, sincronizada
        )
        VALUES (?, ?, ?, ?, ?, 0)
      `);
      stmtInsert.run(id, tarefa_id, tipo, arquivo_base64, geolocalizacao);

      // Register in sync queue
      const stmtSync = db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas, ultima_tentativa)
        VALUES (?, 'evidencia', ?, 'PENDENTE', 0, null)
      `);
      stmtSync.run(uuidv7(), id);

      db.exec('COMMIT');
      return id;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}

export default new TarefaRepository();