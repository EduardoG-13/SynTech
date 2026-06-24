-- 013_auditoria_acoes.sql
-- Registra ações relevantes para rastreabilidade operacional do sistema.

CREATE TABLE IF NOT EXISTS auditoria_acoes (
  id TEXT PRIMARY KEY NOT NULL,
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
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_criado_em ON auditoria_acoes(criado_em);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_acoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidade ON auditoria_acoes(entidade_tipo, entidade_id);
