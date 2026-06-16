-- 011_fechamento_mensal.sql
-- Fechamento mensal das boletas. Quando o Gerente fecha um mês, as boletas
-- daquele mês ficam TRAVADAS (ninguém edita, nem o capataz).
-- Regra nova: aprovação do Coordenador/Gerente NÃO trava mais a edição do
-- capataz — só o fechamento do mês trava de vez.

CREATE TABLE IF NOT EXISTS fechamentos (
  id          TEXT PRIMARY KEY NOT NULL,
  mes         TEXT NOT NULL,            -- 'AAAA-MM'
  fechado_por TEXT NOT NULL,            -- usuario_id do Gerente
  fechado_em  DATETIME DEFAULT CURRENT_TIMESTAMP,
  observacao  TEXT,
  UNIQUE(mes)
);
