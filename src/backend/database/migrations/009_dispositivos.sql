-- 009_dispositivos.sql
-- Vínculo dispositivo ↔ retiro pro login automático do Capataz.
-- Cada tablet/celular fica "amarrado" a um retiro: ao abrir o app, entra
-- direto como o capataz daquele retiro, sem precisar selecionar de novo.
-- O Gerente ADM pode revogar um dispositivo (ex: tablet trocou de retiro).

CREATE TABLE IF NOT EXISTS dispositivos (
  id            TEXT PRIMARY KEY NOT NULL,
  device_token  TEXT NOT NULL UNIQUE,   -- UUID gerado no 1º acesso, guardado no localStorage
  retiro_id     TEXT NOT NULL,
  capataz_id    TEXT,
  apelido       TEXT,                    -- ex: "Tablet do curral"
  criado_em     DATETIME DEFAULT CURRENT_TIMESTAMP,
  ultimo_acesso DATETIME,
  revogado_em   DATETIME,
  FOREIGN KEY (retiro_id)  REFERENCES retiros(id),
  FOREIGN KEY (capataz_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_dispositivos_token ON dispositivos(device_token);
