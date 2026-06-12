import crypto from 'crypto';
import db from '../config/database';

export interface RefreshTokenRecord {
  id: string;
  usuario_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
}

export function gerarTokenHash(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function salvarRefreshToken(params: {
  id: string;
  usuarioId: string;
  token: string;
  expiresAt: Date;
}) {
  db.prepare(`
    INSERT INTO refresh_tokens (id, usuario_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(
    params.id,
    params.usuarioId,
    gerarTokenHash(params.token),
    params.expiresAt.toISOString()
  );
}

export function buscarRefreshTokenAtivo(id: string, token: string) {
  return db.prepare(`
    SELECT *
    FROM refresh_tokens
    WHERE id = ?
      AND token_hash = ?
      AND revoked_at IS NULL
  `).get(id, gerarTokenHash(token)) as unknown as RefreshTokenRecord | undefined;
}

export function revogarRefreshToken(id: string) {
  db.prepare(`
    UPDATE refresh_tokens
    SET revoked_at = ?, atualizado_em = ?
    WHERE id = ? AND revoked_at IS NULL
  `).run(new Date().toISOString(), new Date().toISOString(), id);
}

export function revogarRefreshTokenPorToken(token: string) {
  db.prepare(`
    UPDATE refresh_tokens
    SET revoked_at = ?, atualizado_em = ?
    WHERE token_hash = ? AND revoked_at IS NULL
  `).run(new Date().toISOString(), new Date().toISOString(), gerarTokenHash(token));
}

export function tokenEstaExpirado(record: RefreshTokenRecord) {
  return new Date(record.expires_at).getTime() <= Date.now();
}
