-- 007_tarefas_pre_agendadas.sql
-- Tarefas pré-agendadas pelo Gerente: o gerente especifica o TIPO da boleta,
-- retiro, capataz, data, instrução em texto/áudio/foto.
-- O Capataz "executa" a tarefa preenchendo as quantidades na nova-os e a tarefa
-- fica vinculada à movimentação resultante via movimentacoes.tarefa_id.

ALTER TABLE tarefas ADD COLUMN tipo_operacao TEXT;
ALTER TABLE tarefas ADD COLUMN prioridade TEXT DEFAULT 'media';
ALTER TABLE tarefas ADD COLUMN observacoes TEXT;
ALTER TABLE tarefas ADD COLUMN audio_base64 TEXT;
ALTER TABLE tarefas ADD COLUMN foto_base64 TEXT;
ALTER TABLE tarefas ADD COLUMN vista_em DATETIME;
ALTER TABLE movimentacoes ADD COLUMN tarefa_id TEXT;
