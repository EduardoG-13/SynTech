CREATE TABLE IF NOT EXISTS nascimentos (
    id              TEXT PRIMARY KEY,
    movimentacao_id TEXT NOT NULL UNIQUE REFERENCES movimentacoes(id),
    quantidade      INTEGER NOT NULL CHECK (quantidade > 0),
    raca            TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_nascimentos_movimentacao ON nascimentos(movimentacao_id);
