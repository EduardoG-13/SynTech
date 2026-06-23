import { v7 as uuidv7 } from 'uuid';
import db from '../config/database';

export interface RegistroAuditoria {
  usuario_id?: string | null;
  usuario_nome?: string | null;
  perfil?: string | null;
  acao: string;
  entidade_tipo?: string | null;
  entidade_id?: string | null;
  metodo?: string | null;
  rota?: string | null;
  status_http?: number | null;
  detalhes?: any;
}

class AuditoriaRepository {
  private schemaGarantido = false;

  private garantirSchema() {
    if (this.schemaGarantido) return;

    db.exec(`
      CREATE TABLE IF NOT EXISTS auditoria_acoes (
        id TEXT PRIMARY KEY,
        usuario_id TEXT,
        usuario_nome TEXT,
        perfil TEXT,
        acao TEXT NOT NULL,
        entidade_tipo TEXT,
        entidade_id TEXT,
        metodo TEXT,
        rota TEXT,
        status_http INTEGER,
        detalhes TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_auditoria_criado_em ON auditoria_acoes(criado_em);
      CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_acoes(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_auditoria_entidade ON auditoria_acoes(entidade_tipo, entidade_id);
    `);

    this.schemaGarantido = true;
  }

  registrar(registro: RegistroAuditoria) {
    this.garantirSchema();
    const id = uuidv7();
    db.prepare(`
      INSERT INTO auditoria_acoes (
        id, usuario_id, usuario_nome, perfil, acao, entidade_tipo, entidade_id,
        metodo, rota, status_http, detalhes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      registro.usuario_id || null,
      registro.usuario_nome || null,
      registro.perfil || null,
      registro.acao,
      registro.entidade_tipo || null,
      registro.entidade_id || null,
      registro.metodo || null,
      registro.rota || null,
      registro.status_http || null,
      registro.detalhes ? JSON.stringify(registro.detalhes).slice(0, 2000) : null,
    );
    return id;
  }

  listar(limite = 200) {
    this.garantirSchema();
    return db.prepare(`
      SELECT *
      FROM auditoria_acoes
      ORDER BY criado_em DESC
      LIMIT ?
    `).all(Math.min(Math.max(Number(limite) || 200, 1), 500));
  }
}

export default new AuditoriaRepository();
