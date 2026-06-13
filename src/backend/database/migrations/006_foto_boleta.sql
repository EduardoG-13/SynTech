-- Adiciona coluna foto_base64 em movimentacoes pra guardar a imagem anexada à boleta
-- (era só tem_foto boolean, então a imagem se perdia depois do upload)
ALTER TABLE movimentacoes ADD COLUMN foto_base64 TEXT;
