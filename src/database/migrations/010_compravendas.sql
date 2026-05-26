CREATE TABLE IF NOT EXISTS compravendas (
    id               TEXT PRIMARY KEY,
    movimentacao_id  TEXT NOT NULL UNIQUE REFERENCES movimentacoes(id),
    tipo_negocio     TEXT NOT NULL CHECK (tipo_negocio IN ('compra','venda')),
    valor_financeiro REAL NOT NULL CHECK (valor_financeiro > 0),
    quantidade       INTEGER NOT NULL CHECK (quantidade > 0),
    created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_compravendas_movimentacao ON compravendas(movimentacao_id);
