CREATE TABLE IF NOT EXISTS usuarios (
    id         TEXT PRIMARY KEY,
    retiro_id  TEXT REFERENCES retiros(id),
    nome       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    perfil     TEXT NOT NULL
                   CHECK (perfil IN ('gerente','capataz','coordenador','tecnico_infra')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    CHECK (perfil != 'capataz' OR retiro_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_retiro ON usuarios(retiro_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON usuarios(perfil);
