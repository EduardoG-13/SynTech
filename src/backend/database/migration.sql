-- migration.sql
-- Criação das tabelas do banco de dados SQLite para o backend BrPec

CREATE TABLE IF NOT EXISTS retiros (
    id TEXT PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL,
    numero TEXT,
    localizacao TEXT NOT NULL,
    coordenador_id TEXT,
    capataz_id TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL,
    senha TEXT NOT NULL,
    perfil TEXT NOT NULL CHECK(perfil IN ('Gerente', 'Coordenador', 'Capataz', 'Tecnico')),
    retiro_id TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (retiro_id) REFERENCES retiros(id)
);

CREATE TABLE IF NOT EXISTS tarefas (
    id TEXT PRIMARY KEY NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL CHECK(status IN ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA')),
    data_execucao DATE NOT NULL,
    retiro_id TEXT NOT NULL,
    capataz_id TEXT NOT NULL,
    gerente_id TEXT NOT NULL,
    criada_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    concluida_em DATETIME,
    sincronizada BOOLEAN DEFAULT 0,
    FOREIGN KEY (retiro_id) REFERENCES retiros(id),
    FOREIGN KEY (capataz_id) REFERENCES usuarios(id),
    FOREIGN KEY (gerente_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS evidencias (
    id TEXT PRIMARY KEY NOT NULL,
    tarefa_id TEXT,
    alerta_id TEXT,
    movimentacao_id TEXT,
    tipo TEXT NOT NULL,
    arquivo_base64 TEXT,
    url_arquivo TEXT,
    geolocalizacao TEXT,
    duracao_segundos INTEGER,
    conteudo TEXT,
    tamanho_bytes INTEGER,
    criada_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    sincronizada BOOLEAN DEFAULT 0,
    FOREIGN KEY (tarefa_id) REFERENCES tarefas(id)
);

CREATE TABLE IF NOT EXISTS alertas (
    id TEXT PRIMARY KEY NOT NULL,
    tipo TEXT NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL CHECK(status IN ('ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO')),
    capataz_id TEXT NOT NULL,
    retiro_id TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    sincronizado BOOLEAN DEFAULT 0,
    foto_id TEXT,
    tecnico_id TEXT,
    solucao_resolucao TEXT,
    resolvido_em DATETIME,
    local_referencia TEXT,
    audio_base64 TEXT,
    solucao_audio_base64 TEXT,
    FOREIGN KEY (capataz_id) REFERENCES usuarios(id),
    FOREIGN KEY (retiro_id) REFERENCES retiros(id),
    FOREIGN KEY (foto_id) REFERENCES evidencias(id),
    FOREIGN KEY (tecnico_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS movimentacoes (
    id TEXT PRIMARY KEY NOT NULL,
    capataz_id TEXT NOT NULL,
    retiro_id TEXT NOT NULL,
    data DATE NOT NULL,
    categoria TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    sincronizado BOOLEAN DEFAULT 0,
    validado BOOLEAN DEFAULT 0,
    coordenador_id TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (capataz_id) REFERENCES usuarios(id),
    FOREIGN KEY (retiro_id) REFERENCES retiros(id),
    FOREIGN KEY (coordenador_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS nascimentos (
    id TEXT PRIMARY KEY NOT NULL,
    movimentacao_id TEXT NOT NULL,
    FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes(id)
);

CREATE TABLE IF NOT EXISTS obitos (
    id TEXT PRIMARY KEY NOT NULL,
    movimentacao_id TEXT NOT NULL,
    identificacao_animal TEXT NOT NULL,
    causa_morte TEXT NOT NULL,
    foto_id TEXT NOT NULL,
    FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes(id),
    FOREIGN KEY (foto_id) REFERENCES evidencias(id)
);

CREATE TABLE IF NOT EXISTS transferencias (
    id TEXT PRIMARY KEY NOT NULL,
    movimentacao_id TEXT NOT NULL,
    retiro_origem_id TEXT NOT NULL,
    retiro_destino_id TEXT NOT NULL,
    FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes(id),
    FOREIGN KEY (retiro_origem_id) REFERENCES retiros(id),
    FOREIGN KEY (retiro_destino_id) REFERENCES retiros(id)
);

CREATE TABLE IF NOT EXISTS compravendas (
    id TEXT PRIMARY KEY NOT NULL,
    movimentacao_id TEXT NOT NULL,
    tipo_negocio TEXT NOT NULL,
    valor_financeiro REAL NOT NULL,
    FOREIGN KEY (movimentacao_id) REFERENCES movimentacoes(id)
);

CREATE TABLE IF NOT EXISTS sincronizacoes (
    id TEXT PRIMARY KEY NOT NULL,
    entidade_tipo TEXT NOT NULL,
    entidade_id TEXT NOT NULL,
    status_envio TEXT NOT NULL,
    tentativas INTEGER DEFAULT 0,
    ultima_tentativa DATETIME,
    criada_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exportacoes (
    id TEXT PRIMARY KEY NOT NULL,
    coordenador_id TEXT NOT NULL,
    formato TEXT NOT NULL,
    filtro_retiro TEXT,
    filtro_data_inicio DATE,
    filtro_data_fim DATE,
    gerada_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coordenador_id) REFERENCES usuarios(id)
);
