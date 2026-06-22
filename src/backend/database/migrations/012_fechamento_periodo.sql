-- 012_fechamento_periodo.sql
-- Fechamento por INTERVALO de datas (de — até), não só mês fechado.
-- Mantém a coluna `mes` (compatibilidade) mas agora aceita NULL pra fechamentos por período.
ALTER TABLE fechamentos ADD COLUMN data_inicio TEXT;
ALTER TABLE fechamentos ADD COLUMN data_fim TEXT;
