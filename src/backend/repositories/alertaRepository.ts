import db from '../config/database';
import { v7 as uuidv7 } from 'uuid';

class AlertaRepository {
  async criar(alerta: any): Promise<any> {
    const id = uuidv7();

    db.exec('BEGIN TRANSACTION');
    try {
      const stmtInsert = db.prepare(`
        INSERT INTO alertas (
          id, tipo, descricao, status, capataz_id,
          retiro_id, latitude, longitude, local_referencia, audio_base64, sincronizado
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `);
      stmtInsert.run(
        id,
        alerta.tipo,
        alerta.descricao || null,
        'ABERTO',
        alerta.capataz_id,
        alerta.retiro_id,
        alerta.latitude,
        alerta.longitude,
        alerta.local_referencia || null,
        alerta.audio_base64 || null,
      );

      let fotoId = null;
      if (alerta.foto_base64) {
        fotoId = uuidv7();
        const stmtFoto = db.prepare(`
          INSERT INTO evidencias (
            id, alerta_id, tipo, arquivo_base64, sincronizada
          )
          VALUES (?, ?, 'FOTO', ?, 0)
        `);
        stmtFoto.run(fotoId, id, alerta.foto_base64);

        const stmtUpdateAlerta = db.prepare(`
          UPDATE alertas
          SET foto_id = ?
          WHERE id = ?
        `);
        stmtUpdateAlerta.run(fotoId, id);
      }

      const stmtSync = db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas, ultima_tentativa)
        VALUES (?, 'alerta', ?, 'PENDENTE', 0, null)
      `);
      stmtSync.run(uuidv7(), id);

      if (fotoId) {
        const stmtSyncFoto = db.prepare(`
          INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas, ultima_tentativa)
          VALUES (?, 'evidencia', ?, 'PENDENTE', 0, null)
        `);
        stmtSyncFoto.run(uuidv7(), fotoId);
      }

      db.exec('COMMIT');
      return this.buscarPorId(id);
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  async buscarPorId(id: string): Promise<any | null> {
    const stmt = db.prepare('SELECT * FROM alertas WHERE id = ?');
    const row = stmt.get(id);
    return row || null;
  }

  async buscarUsuarioPorId(id: string): Promise<any | null> {
    const stmt = db.prepare('SELECT id, perfil FROM usuarios WHERE id = ?');
    const row = stmt.get(id);
    return row || null;
  }

  async listar(status?: string, tipo?: string): Promise<any[]> {
    const conds: string[] = [];
    const params: any[] = [];
    if (status) { conds.push('status = ?'); params.push(status); }
    if (tipo)   { conds.push('LOWER(tipo) = LOWER(?)'); params.push(tipo); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const stmt = db.prepare(`
      SELECT * FROM alertas
      ${where}
      ORDER BY criado_em DESC
    `);
    return stmt.all(...params) as any[];
  }

  async resolver(
    id: string,
    tecnico_id: string,
    solucao: string,
    foto_base64: string
  ): Promise<any | null> {
    const evidenciaId = uuidv7();

    db.exec('BEGIN TRANSACTION');
    try {
      // 1. Insert evidence FOTO
      const stmtEvidencia = db.prepare(`
        INSERT INTO evidencias (
          id, alerta_id, tipo, arquivo_base64, sincronizada
        )
        VALUES (?, ?, 'FOTO', ?, 0)
      `);
      stmtEvidencia.run(evidenciaId, id, foto_base64);

      // 2. Update alerta (using fields defined in migration.sql)
      const stmtAlerta = db.prepare(`
        UPDATE alertas
        SET status = 'RESOLVIDO',
            tecnico_id = ?,
            foto_id = ?,
            sincronizado = 0
        WHERE id = ?
      `);
      const info = stmtAlerta.run(tecnico_id, evidenciaId, id);

      if ((info as any).changes === 0) {
        db.exec('ROLLBACK');
        return null;
      }

      // 3. Register outbox sync entries for both evidence and alert update
      const stmtSyncEv = db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas, ultima_tentativa)
        VALUES (?, 'evidencia', ?, 'PENDENTE', 0, null)
      `);
      stmtSyncEv.run(uuidv7(), evidenciaId);

      const stmtSyncAl = db.prepare(`
        INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas, ultima_tentativa)
        VALUES (?, 'alerta', ?, 'PENDENTE', 0, null)
      `);
      stmtSyncAl.run(uuidv7(), id);

      db.exec('COMMIT');
      return this.buscarPorId(id);
    } catch (erro) {
      db.exec('ROLLBACK');
      throw erro;
    }
  }
}

export default new AlertaRepository();