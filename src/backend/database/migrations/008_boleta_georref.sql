-- 008_boleta_georref.sql
-- Georreferência das boletas: toda foto/registro guarda lat/lng pra rastreabilidade.
ALTER TABLE movimentacoes ADD COLUMN latitude REAL;
ALTER TABLE movimentacoes ADD COLUMN longitude REAL;
