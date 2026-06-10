-- 003_aprovacao_coordenador.sql
-- Coordenador é quem APROVA as boletas (regra atualizada 2026-06-10).
-- Adiciona rastreabilidade de quem aprovou e quando.

ALTER TABLE movimentacoes ADD COLUMN aprovado_por_coordenador_id TEXT;
ALTER TABLE movimentacoes ADD COLUMN aprovado_em DATETIME;
