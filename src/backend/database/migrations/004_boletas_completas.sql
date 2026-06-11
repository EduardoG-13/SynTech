-- 004_boletas_completas.sql
-- Estende movimentacoes para guardar TODOS os campos da boleta (modelo flexível).
-- Várias categorias na mesma boleta = várias rows com mesmo grupo_id.

ALTER TABLE movimentacoes ADD COLUMN tipo_operacao TEXT;        -- nascimento, obito, transferencia, compravenda, evolucao, manejo
ALTER TABLE movimentacoes ADD COLUMN grupo_id TEXT;             -- ID lógico da boleta (várias rows agrupadas)
ALTER TABLE movimentacoes ADD COLUMN pasto TEXT;
ALTER TABLE movimentacoes ADD COLUMN observacoes TEXT;
ALTER TABLE movimentacoes ADD COLUMN observacoes_audio_base64 TEXT;
ALTER TABLE movimentacoes ADD COLUMN tem_foto INTEGER DEFAULT 0;
ALTER TABLE movimentacoes ADD COLUMN raca TEXT;
ALTER TABLE movimentacoes ADD COLUMN brinco TEXT;
ALTER TABLE movimentacoes ADD COLUMN causa_morte TEXT;
ALTER TABLE movimentacoes ADD COLUMN tipo_negocio TEXT;
ALTER TABLE movimentacoes ADD COLUMN valor_financeiro REAL;
ALTER TABLE movimentacoes ADD COLUMN retiro_origem_id TEXT;
ALTER TABLE movimentacoes ADD COLUMN retiro_destino_id TEXT;
ALTER TABLE movimentacoes ADD COLUMN tipo_transporte TEXT;
ALTER TABLE movimentacoes ADD COLUMN motorista TEXT;
ALTER TABLE movimentacoes ADD COLUMN rg_cpf_motorista TEXT;
ALTER TABLE movimentacoes ADD COLUMN placa TEXT;
ALTER TABLE movimentacoes ADD COLUMN titulo TEXT;

CREATE INDEX IF NOT EXISTS idx_mov_grupo_id ON movimentacoes(grupo_id);
CREATE INDEX IF NOT EXISTS idx_mov_capataz ON movimentacoes(capataz_id);
CREATE INDEX IF NOT EXISTS idx_mov_aprovacao ON movimentacoes(aprovado_por_coordenador_id);
