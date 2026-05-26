CREATE TABLE IF NOT EXISTS obitos (
    id                    TEXT PRIMARY KEY,
    movimentacao_id        TEXT NOT NULL UNIQUE REFERENCES movimentacoes(id),
    identificacao_animal   TEXT,
    quantidade             INTEGER NOT NULL CHECK (quantidade > 0),
    causa                  TEXT NOT NULL,
    exige_evidencia_foto   INTEGER NOT NULL DEFAULT 1 CHECK (exige_evidencia_foto IN (0,1)),
    created_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_obitos_movimentacao ON obitos(movimentacao_id);
