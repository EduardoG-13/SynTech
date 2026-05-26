CREATE TABLE IF NOT EXISTS movimentacoes (
    id                TEXT PRIMARY KEY,
    retiro_id         TEXT NOT NULL REFERENCES retiros(id),
    responsavel_id    TEXT NOT NULL REFERENCES usuarios(id),
    tipo              TEXT NOT NULL
                          CHECK (tipo IN ('nascimento','obito','transferencia','compravenda')),
    categoria         TEXT NOT NULL
                          CHECK (categoria IN ('bezerro','garrote','boi_touro','bezerra','novilha','vaca')),
    data_movimentacao TEXT NOT NULL,
    observacoes       TEXT,
    sync_status       TEXT NOT NULL DEFAULT 'pendente'
                          CHECK (sync_status IN ('pendente','sincronizado','erro')),
    last_synced_at    TEXT,
    created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_retiro      ON movimentacoes(retiro_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_responsavel ON movimentacoes(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo        ON movimentacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_sync        ON movimentacoes(sync_status);
