import db from './config/database';
import bcrypt from 'bcryptjs';
import { inicializarBanco } from './config/initDb';

// Garante que as tabelas existem antes de inserir os dados
inicializarBanco();

const senhaHash = bcrypt.hashSync('123456', 10);

try {
  // ==================== RETIROS ====================
  const retiros = [
    { id: 'retiro-acurizal',     nome: 'Acurizal',     loc: 'Sede Acurizal' },
    { id: 'retiro-aroeira',      nome: 'Aroeira',      loc: 'Sede Aroeira' },
    { id: 'retiro-baia-bonita',  nome: 'Baia Bonita',  loc: 'Sede Baia Bonita' },
    { id: 'retiro-bodoquena-1',  nome: 'Bodoquena 1',  loc: 'Sede Bodoquena 1' },
    { id: 'retiro-bodoquena-2',  nome: 'Bodoquena 2',  loc: 'Sede Bodoquena 2' },
    { id: 'retiro-boqueirao',    nome: 'Boqueirão',    loc: 'Sede Boqueirão' },
    { id: 'retiro-caieira',      nome: 'Caieira',      loc: 'Sede Caieira' },
    { id: 'retiro-cmb',          nome: 'CMB',          loc: 'Sede CMB' },
    { id: 'retiro-confinamento', nome: 'Confinamento', loc: 'Sede Confinamento' },
    { id: 'retiro-cristo',       nome: 'Cristo',       loc: 'Sede Cristo' },
    { id: 'retiro-morada-nova',  nome: 'Morada Nova',  loc: 'Sede Morada Nova' },
    { id: 'retiro-morro-azul',   nome: 'Morro Azul',   loc: 'Sede Morro Azul' },
    { id: 'retiro-puga',         nome: 'Puga',         loc: 'Sede Puga' },
    { id: 'retiro-sao-miguel',   nome: 'São Miguel',   loc: 'Sede São Miguel' },
    { id: 'retiro-vista-alegre', nome: 'Vista Alegre', loc: 'Sede Vista Alegre' },
  ];

  // Inserir coordenadores ANTES dos retiros (FK)
  const coordenadores = [
    { id: 'coord-1', nome: 'marcos' },
    { id: 'coord-2', nome: 'rafael' },
    { id: 'coord-3', nome: 'carlos' },
    { id: 'coord-4', nome: 'anderson' },
    { id: 'coord-5', nome: 'fernando' },
    { id: 'coord-6', nome: 'lucas' },
    { id: 'coord-7', nome: 'pedro' },
  ];

  for (const c of coordenadores) {
    db.prepare(`INSERT OR IGNORE INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)`)
      .run(c.id, c.nome, senhaHash, 'Coordenador', null);
  }

  // Agora os retiros com coordenador_id atribuído
  const stmtRetiro = db.prepare(
    `INSERT OR IGNORE INTO retiros (id, nome, localizacao, coordenador_id) VALUES (?, ?, ?, ?)`
  );
  const coordDistribuicao = ['coord-1','coord-1','coord-2','coord-2','coord-3','coord-3','coord-4','coord-4','coord-5','coord-5','coord-6','coord-6','coord-7','coord-7','coord-7'];
  for (let i = 0; i < retiros.length; i++) {
    stmtRetiro.run(retiros[i].id, retiros[i].nome, retiros[i].loc, coordDistribuicao[i]);
  }

  // ==================== GERENTE (único) ====================
  db.prepare(`INSERT OR IGNORE INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)`)
    .run('gerente-1', 'admin', senhaHash, 'Gerente', null);

  // ==================== CAPATAZES ====================
  const capatazes = [
    { id: 'cap-rogerio',    nome: 'Rogério',    retiro: 'retiro-acurizal' },
    { id: 'cap-lucas',      nome: 'Lucas',      retiro: 'retiro-aroeira' },
    { id: 'cap-marcelo',    nome: 'Marcelo',    retiro: 'retiro-baia-bonita' },
    { id: 'cap-fabiano',    nome: 'Fabiano',    retiro: 'retiro-bodoquena-1' },
    { id: 'cap-valdineis',  nome: 'Valdineis',  retiro: 'retiro-bodoquena-2' },
    { id: 'cap-daniel',     nome: 'Daniel',     retiro: 'retiro-boqueirao' },
    { id: 'cap-joaopaulo',  nome: 'João Paulo', retiro: 'retiro-caieira' },
    { id: 'cap-alberto',    nome: 'Alberto',    retiro: 'retiro-cmb' },
    { id: 'cap-josecarlos', nome: 'José Carlos',retiro: 'retiro-cristo' },
    { id: 'cap-valdeci',    nome: 'Valdeci',    retiro: 'retiro-morada-nova' },
    { id: 'cap-manoel',     nome: 'Manoel',     retiro: 'retiro-puga' },
    { id: 'cap-wilson',     nome: 'Wilson',     retiro: 'retiro-sao-miguel' },
    { id: 'cap-ariovaldo',  nome: 'Ariovaldo',  retiro: 'retiro-vista-alegre' },
  ];

  for (const c of capatazes) {
    db.prepare(`INSERT OR IGNORE INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)`)
      .run(c.id, c.nome, senhaHash, 'Capataz', c.retiro);
    // Vincula o capataz ao retiro também pelo lado do retiro (retiros.capataz_id)
    db.prepare(`UPDATE retiros SET capataz_id = ? WHERE id = ?`).run(c.id, c.retiro);
  }

  console.log('[seed] Seed concluído com sucesso!');
  console.log('[seed] 15 retiros criados');
  console.log('[seed] Usuários:');
  console.log('  Gerente:       admin / 123456');
  console.log('  Coordenadores: marcos, rafael, carlos, anderson, fernando, lucas, pedro / 123456');
  console.log('  Capatazes:     13 capatazes vinculados aos retiros / 123456');
  console.log('');
  console.log('[seed] Obs: Valdineis é capataz de Bodoquena 2 e Confinamento');
  console.log('[seed] Obs: Daniel é capataz de Boqueirão e Morro Azul');

} catch (e: any) {
  console.error('Erro no seed:', e.message);
}
