-- 005_chamado_local_e_audio.sql
-- Adiciona campo de local em texto (redundância ao GPS) e áudio em chamados.

ALTER TABLE alertas ADD COLUMN local_referencia TEXT;
ALTER TABLE alertas ADD COLUMN audio_base64 TEXT;
ALTER TABLE alertas ADD COLUMN solucao_audio_base64 TEXT;
