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
    // Carrega o alerta junto com a foto inicial do capataz (foto_id) e a foto da resolução,
    // se existir. Sem esses JOINs, a tela do Infra não tem como mostrar a evidência anexada.
    const stmt = db.prepare(`
      SELECT a.*,
             ev_capataz.arquivo_base64 AS foto_base64,
             ev_resol.arquivo_base64    AS foto_resolucao_base64,
             r.nome  AS retiro_nome,
             cap.nome AS capataz_nome,
             tec.nome AS tecnico_nome
      FROM alertas a
      LEFT JOIN evidencias ev_capataz ON ev_capataz.id = a.foto_id
      LEFT JOIN evidencias ev_resol   ON ev_resol.alerta_id = a.id AND ev_resol.id <> a.foto_id
      LEFT JOIN retiros   r   ON r.id = a.retiro_id
      LEFT JOIN usuarios  cap ON cap.id = a.capataz_id
      LEFT JOIN usuarios  tec ON tec.id = a.tecnico_id
      WHERE a.id = ?
      LIMIT 1
    `);
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

  async iniciar(id: string, tecnico_id: string): Promise<any | null> {
    db.exec('BEGIN TRANSACTION');
    try {
      const stmtAlerta = db.prepare(`
        UPDATE alertas
        SET status = 'EM_ANDAMENTO',
            tecnico_id = ?,
            sincronizado = 0
        WHERE id = ?
          AND status = 'ABERTO'
      `);
      const info = stmtAlerta.run(tecnico_id, id);

      if ((info as any).changes === 0) {
        db.exec('ROLLBACK');
        return this.buscarPorId(id);
      }

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

  async resolver(
    id: string,
    tecnico_id: string,
    solucao: string,
    foto_base64: string,
    audio_base64 = ''
  ): Promise<any | null> {
    const evidenciaId = foto_base64 ? uuidv7() : null;

    db.exec('BEGIN TRANSACTION');
    try {
      // 1. Insert evidence FOTO
      if (evidenciaId) {
        const stmtEvidencia = db.prepare(`
          INSERT INTO evidencias (
            id, alerta_id, tipo, arquivo_base64, sincronizada
          )
          VALUES (?, ?, 'FOTO', ?, 0)
        `);
        stmtEvidencia.run(evidenciaId, id, foto_base64);
      }

      // 2. Update alerta (using fields defined in migration.sql)
      const stmtAlerta = db.prepare(`
        UPDATE alertas
        SET status = 'RESOLVIDO',
            tecnico_id = ?,
            foto_id = ?,
            solucao_resolucao = ?,
            solucao_audio_base64 = ?,
            resolvido_em = datetime('now'),
            sincronizado = 0
        WHERE id = ?
      `);
      const info = stmtAlerta.run(tecnico_id, evidenciaId, solucao || null, audio_base64 || null, id);

      if ((info as any).changes === 0) {
        db.exec('ROLLBACK');
        return null;
      }

      // 3. Register outbox sync entries for both evidence and alert update
      if (evidenciaId) {
        const stmtSyncEv = db.prepare(`
          INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas, ultima_tentativa)
          VALUES (?, 'evidencia', ?, 'PENDENTE', 0, null)
        `);
        stmtSyncEv.run(uuidv7(), evidenciaId);
      }

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
