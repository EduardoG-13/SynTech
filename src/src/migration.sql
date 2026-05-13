-- migration.sql
-- BrPec Agropecuaria - banco SQLite local offline-first.
-- Execute do zero em banco vazio. Ordem obrigatoria por causa das FKs.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS retiros (
    id          TEXT PRIMARY KEY,
    nome        TEXT NOT NULL,
    localizacao TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

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

CREATE TABLE IF NOT EXISTS tarefas (
    id             TEXT PRIMARY KEY,
    retiro_id      TEXT NOT NULL REFERENCES retiros(id),
    criado_por_id  TEXT NOT NULL REFERENCES usuarios(id),
    responsavel_id TEXT NOT NULL REFERENCES usuarios(id),
    titulo         TEXT NOT NULL,
    descricao      TEXT,
    status         TEXT NOT NULL DEFAULT 'pendente'
                       CHECK (status IN ('pendente','em_andamento','concluida','cancelada')),
    data_prevista  TEXT NOT NULL,
    data_conclusao TEXT,
    sync_status    TEXT NOT NULL DEFAULT 'pendente'
                       CHECK (sync_status IN ('pendente','sincronizado','erro')),
    last_synced_at TEXT,
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    CHECK (
        (status = 'concluida' AND data_conclusao IS NOT NULL)
        OR status != 'concluida'
    )
);
CREATE INDEX IF NOT EXISTS idx_tarefas_retiro      ON tarefas(retiro_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_criado_por  ON tarefas(criado_por_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel ON tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status      ON tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_sync        ON tarefas(sync_status);

CREATE TABLE IF NOT EXISTS alertas (
    id                  TEXT PRIMARY KEY,
    retiro_id           TEXT NOT NULL REFERENCES retiros(id),
    criado_por_id       TEXT NOT NULL REFERENCES usuarios(id),
    tecnico_id          TEXT REFERENCES usuarios(id),
    tipo                TEXT NOT NULL
                            CHECK (tipo IN ('cerca','bebedouro','hidraulica','eletrica','infraestrutura','outro')),
    titulo              TEXT NOT NULL,
    descricao           TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'aberto'
                            CHECK (status IN ('aberto','em_andamento','fechado')),
    localizacao_lat     REAL NOT NULL,
    localizacao_lng     REAL NOT NULL,
    data_resolucao      TEXT,
    descricao_resolucao TEXT,
    sync_status         TEXT NOT NULL DEFAULT 'pendente'
                            CHECK (sync_status IN ('pendente','sincronizado','erro')),
    last_synced_at      TEXT,
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    CHECK (
        (status = 'fechado' AND data_resolucao IS NOT NULL)
        OR status != 'fechado'
    )
);
CREATE INDEX IF NOT EXISTS idx_alertas_retiro     ON alertas(retiro_id);
CREATE INDEX IF NOT EXISTS idx_alertas_status     ON alertas(status);
CREATE INDEX IF NOT EXISTS idx_alertas_tipo       ON alertas(tipo);
CREATE INDEX IF NOT EXISTS idx_alertas_criado_por ON alertas(criado_por_id);
CREATE INDEX IF NOT EXISTS idx_alertas_tecnico    ON alertas(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_alertas_sync       ON alertas(sync_status);

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

CREATE TABLE IF NOT EXISTS evidencias (
    id                TEXT PRIMARY KEY,
    tarefa_id         TEXT REFERENCES tarefas(id),
    alerta_id         TEXT REFERENCES alertas(id),
    movimentacao_id   TEXT REFERENCES movimentacoes(id),
    tipo              TEXT NOT NULL CHECK (tipo IN ('foto','audio','video','documento','texto')),
    arquivo_local_uri TEXT,
    storage_key       TEXT,
    url               TEXT,
    conteudo_texto    TEXT,
    mime_type         TEXT,
    tamanho_bytes     INTEGER CHECK (tamanho_bytes IS NULL OR tamanho_bytes >= 0),
    sync_status       TEXT NOT NULL DEFAULT 'pendente'
                          CHECK (sync_status IN ('pendente','sincronizado','erro')),
    uploaded_at       TEXT,
    created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    CHECK (
        (tarefa_id IS NOT NULL AND alerta_id IS NULL AND movimentacao_id IS NULL)
        OR (tarefa_id IS NULL AND alerta_id IS NOT NULL AND movimentacao_id IS NULL)
        OR (tarefa_id IS NULL AND alerta_id IS NULL AND movimentacao_id IS NOT NULL)
    ),
    CHECK (
        (tipo = 'texto' AND conteudo_texto IS NOT NULL)
        OR (
            tipo != 'texto'
            AND (
                arquivo_local_uri IS NOT NULL
                OR storage_key IS NOT NULL
                OR url IS NOT NULL
            )
        )
    )
);
CREATE INDEX IF NOT EXISTS idx_evidencias_tarefa       ON evidencias(tarefa_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_alerta       ON evidencias(alerta_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_movimentacao ON evidencias(movimentacao_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_sync         ON evidencias(sync_status);

CREATE TABLE IF NOT EXISTS nascimentos (
    id              TEXT PRIMARY KEY,
    movimentacao_id TEXT NOT NULL UNIQUE REFERENCES movimentacoes(id),
    quantidade      INTEGER NOT NULL CHECK (quantidade > 0),
    raca            TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_nascimentos_movimentacao ON nascimentos(movimentacao_id);

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

CREATE TABLE IF NOT EXISTS transferencias (
    id                TEXT PRIMARY KEY,
    movimentacao_id   TEXT NOT NULL UNIQUE REFERENCES movimentacoes(id),
    retiro_origem_id  TEXT NOT NULL REFERENCES retiros(id),
    retiro_destino_id TEXT NOT NULL REFERENCES retiros(id),
    quantidade        INTEGER NOT NULL CHECK (quantidade > 0),
    created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    CHECK (retiro_origem_id != retiro_destino_id)
);
CREATE INDEX IF NOT EXISTS idx_transferencias_movimentacao ON transferencias(movimentacao_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_origem       ON transferencias(retiro_origem_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_destino      ON transferencias(retiro_destino_id);

CREATE TABLE IF NOT EXISTS compravendas (
    id               TEXT PRIMARY KEY,
    movimentacao_id  TEXT NOT NULL UNIQUE REFERENCES movimentacoes(id),
    tipo_negocio     TEXT NOT NULL CHECK (tipo_negocio IN ('compra','venda')),
    valor_financeiro REAL NOT NULL CHECK (valor_financeiro > 0),
    quantidade       INTEGER NOT NULL CHECK (quantidade > 0),
    created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_compravendas_movimentacao ON compravendas(movimentacao_id);

CREATE TABLE IF NOT EXISTS sync_queue (
    id             TEXT PRIMARY KEY,
    tabela         TEXT NOT NULL,
    registro_id    TEXT NOT NULL,
    operacao       TEXT NOT NULL CHECK (operacao IN ('insert','update','delete','upload')),
    payload_json   TEXT,
    status         TEXT NOT NULL DEFAULT 'pendente'
                       CHECK (status IN ('pendente','processando','sincronizado','erro')),
    tentativas     INTEGER NOT NULL DEFAULT 0 CHECK (tentativas >= 0),
    ultimo_erro    TEXT,
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_registro ON sync_queue(tabela, registro_id);
