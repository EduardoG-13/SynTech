import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import db from '../../config/database';
import { inicializarBanco } from '../../config/initDb';
import tarefaRepository from '../../repositories/tarefaRepository';
import cloudSyncService from '../../services/cloudSyncService';
import supabasePool from '../../config/supabasePool';

async function run() {
  console.log('=== INICIANDO VERIFICAÇÃO END-TO-END DE SINCRONIZAÇÃO ===');
  
  // 1. Inicializar banco de dados SQLite local
  console.log('\n[Passo 1] Inicializando banco local...');
  inicializarBanco();

  const RETIRO_ID = 'retiro-manual-sync-test';
  const CAPATAZ_ID = 'capataz-manual-sync-test';
  const GERENTE_ID = 'gerente-manual-sync-test';

  // 2. Garantir seeds no SQLite e no Supabase (para evitar violações de chaves estrangeiras)
  console.log('\n[Passo 2] Garantindo retiros e usuários nos bancos (SQLite e Supabase)...');

  // SQLite local seeds
  db.prepare(`
    INSERT OR REPLACE INTO retiros (id, nome, localizacao, coordenador_id)
    VALUES (?, 'Retiro Sede Sync', 'Sede', ?)
  `).run(RETIRO_ID, GERENTE_ID);

  db.prepare(`
    INSERT OR REPLACE INTO usuarios (id, nome, senha, perfil, retiro_id)
    VALUES (?, 'Gerente Manual', '123', 'Gerente', null)
  `).run(GERENTE_ID);

  db.prepare(`
    INSERT OR REPLACE INTO usuarios (id, nome, senha, perfil, retiro_id)
    VALUES (?, 'Capataz Manual', '123', 'Capataz', ?)
  `).run(CAPATAZ_ID, RETIRO_ID);

  // Supabase remote seeds
  try {
    await supabasePool.query(`
      INSERT INTO retiros (id, nome, localizacao, coordenador_id)
      VALUES ($1, 'Retiro Sede Sync', 'Sede', $2)
      ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome
    `, [RETIRO_ID, GERENTE_ID]);

    await supabasePool.query(`
      INSERT INTO usuarios (id, nome, senha, perfil, retiro_id)
      VALUES ($1, 'Gerente Manual', '123', 'Gerente', null)
      ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome
    `, [GERENTE_ID]);

    await supabasePool.query(`
      INSERT INTO usuarios (id, nome, senha, perfil, retiro_id)
      VALUES ($1, 'Capataz Manual', '123', 'Capataz', $2)
      ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, retiro_id = EXCLUDED.retiro_id
    `, [CAPATAZ_ID, RETIRO_ID]);

    console.log('✔ Seeds persistidos e sincronizados com sucesso.');
  } catch (err: any) {
    console.error('❌ Falha ao inserir seeds no Supabase:', err.message);
    process.exit(1);
  }

  // 3. Criar tarefa localmente via repositório (que deve gerar o outbox)
  console.log('\n[Passo 3] Criando tarefa localmente (SQLite)...');
  const DATA_FUTURA = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]; // +5 dias
  
  const tarefaLocal = await tarefaRepository.criar({
    titulo: 'Vistoriar reservatório de água',
    descricao: 'Verificar se o nível de água está adequado e sem vazamento',
    retiro_id: RETIRO_ID,
    capataz_id: CAPATAZ_ID,
    data_execucao: DATA_FUTURA,
    gerente_id: GERENTE_ID
  });

  console.log('✔ Tarefa salva no SQLite local com ID:', tarefaLocal.id);
  console.log('  Título:', tarefaLocal.titulo);
  console.log('  Sincronizada local (0=não, 1=sim):', tarefaLocal.sincronizada);

  // Verificar tabela de outbox
  const outboxItem = db.prepare('SELECT * FROM sincronizacoes WHERE entidade_id = ?').get(tarefaLocal.id) as any;
  console.log('\n[Passo 4] Verificando fila de sincronização (sincronizacoes) no SQLite...');
  if (outboxItem) {
    console.log('✔ Item de outbox encontrado na fila!');
    console.log('  Entidade:', outboxItem.entidade_tipo);
    console.log('  ID Entidade:', outboxItem.entidade_id);
    console.log('  Status Envio:', outboxItem.status_envio);
    console.log('  Tentativas:', outboxItem.tentativas);
  } else {
    console.error('❌ Item de outbox não foi criado na fila!');
    process.exit(1);
  }

  // 4. Executar sincronização manual via CloudSyncService
  console.log('\n[Passo 5] Executando cloudSyncService.sincronizar() para subir à nuvem...');
  await cloudSyncService.sincronizar();

  // Verificar outbox e flag local após sincronização
  const outboxItemPos = db.prepare('SELECT * FROM sincronizacoes WHERE entidade_id = ?').get(tarefaLocal.id) as any;
  const tarefaLocalPos = await tarefaRepository.buscarPorId(tarefaLocal.id);

  console.log('\n[Passo 6] Verificando status pós-sincronização no SQLite local...');
  console.log('  Status Envio Outbox:', outboxItemPos.status_envio);
  console.log('  Tarefa Sincronizada local:', tarefaLocalPos.sincronizada);

  // 5. Verificar no Supabase remoto
  console.log('\n[Passo 7] Buscando a tarefa diretamente no Supabase...');
  try {
    const resSupabase = await supabasePool.query('SELECT * FROM tarefas WHERE id = $1', [tarefaLocal.id]);
    if (resSupabase.rows.length > 0) {
      const tarefaNuvem = resSupabase.rows[0];
      console.log('✔ Sucesso! Tarefa encontrada no Supabase (Nuvem)!');
      console.log('  ID Nuvem:', tarefaNuvem.id);
      console.log('  Título Nuvem:', tarefaNuvem.titulo);
      console.log('  Criada em Nuvem:', tarefaNuvem.criada_em);
    } else {
      console.error('❌ Erro: Tarefa não encontrada no Supabase.');
    }
  } catch (err: any) {
    console.error('❌ Falha ao conectar ou buscar no Supabase:', err.message);
  }

  // Finalizar conexões do pool
  await supabasePool.end();
  console.log('\n=== VERIFICAÇÃO CONCLUÍDA COM SUCESSO ===');
}

run().catch(err => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
