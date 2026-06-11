-- 002_gerente_admin.sql
-- Distingue Gerente ADM (master, acessa Configurações) de Gerente comum.
-- Apenas o usuário 'admin' do seed começa como is_admin=1; demais Gerentes precisam
-- ser marcados explicitamente pelo Gerente ADM master ao criar/editar pela tela.

ALTER TABLE usuarios ADD COLUMN is_admin INTEGER DEFAULT 0;

-- Marca o admin inicial do seed como Gerente ADM master
UPDATE usuarios SET is_admin = 1 WHERE id = 'gerente-1';
