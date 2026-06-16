-- 010_numero_boleta.sql
-- Identificador legível da boleta pra rastreabilidade e auditoria (PDF do ADM).
-- Formato: BOL-AAAA-NNNN (ex: BOL-2026-0001). Todas as rows do mesmo grupo_id
-- compartilham o mesmo numero_boleta.
ALTER TABLE movimentacoes ADD COLUMN numero_boleta TEXT;
