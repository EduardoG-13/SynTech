-- 014_transferencia_bilateral.sql
-- Campos para vincular envio e recebimento de uma transferência entre retiros.

ALTER TABLE movimentacoes ADD COLUMN transferencia_par_grupo_id TEXT;
ALTER TABLE movimentacoes ADD COLUMN transferencia_confirmada BOOLEAN DEFAULT 0;
ALTER TABLE movimentacoes ADD COLUMN transferencia_conflito BOOLEAN DEFAULT 0;
