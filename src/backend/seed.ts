import db from './config/database';

try {
  // Retiro
  db.exec(`INSERT OR IGNORE INTO retiros (id, nome, localizacao, coordenador_id) VALUES ('retiro-1', 'Retiro Principal', 'Sede', 'coord-1')`);
  
  // Usuarios
  db.exec(`INSERT OR IGNORE INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES ('capataz-1', 'Joao Capataz', '123', 'Capataz', 'retiro-1')`);
  db.exec(`INSERT OR IGNORE INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES ('gerente-1', 'Maria Gerente', '123', 'Gerente', 'retiro-1')`);
  
  console.log('Seed concluído com sucesso!');
} catch (e) {
  console.error('Erro no seed:', e.message);
}


