/**
 * force-resync.ts
 * Garante que TUDO que está no SQLite local entra na fila de sincronização
 * pra subir pro Supabase na ordem certa (parents antes de children).
 *
 * Como rodar:
 *   npx ts-node src/backend/force-resync.ts
 *
 * Idempotente: usa INSERT OR IGNORE.
 */

import db from './config/database';
import { v7 as uuidv7 } from 'uuid';
import { inicializarBanco } from './config/initDb';

inicializarBanco();

function enfileirar(tipo: string, id: string) {
  db.prepare(
    `INSERT OR IGNORE INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
     VALUES (?, ?, ?, 'PENDENTE', 0)`
  ).run(uuidv7(), tipo, id);
}

console.log('[force-resync] Iniciando reconciliação da fila de sync...');

// 1. Reseta todos os ERRO de volta pra PENDENTE (pra tentar de novo na ordem certa)
const resetErros = db.prepare(
  "UPDATE sincronizacoes SET status_envio = 'PENDENTE', tentativas = 0 WHERE status_envio = 'ERRO'"
).run();
console.log(`[force-resync] ${resetErros.changes} itens com ERRO reenfileirados como PENDENTE.`);

// 2. Enfileira TODOS os retiros (raíz da árvore de FKs)
const retiros = db.prepare('SELECT id FROM retiros').all() as { id: string }[];
let countRetiros = 0;
for (const r of retiros) {
  const antes = db.prepare("SELECT 1 FROM sincronizacoes WHERE entidade_tipo = 'retiro' AND entidade_id = ?").get(r.id);
  if (!antes) { enfileirar('retiro', r.id); countRetiros++; }
}
console.log(`[force-resync] ${countRetiros} retiros enfileirados (de ${retiros.length} totais).`);

// 3. Enfileira TODOS os usuários
const usuarios = db.prepare('SELECT id FROM usuarios').all() as { id: string }[];
let countUsuarios = 0;
for (const u of usuarios) {
  const antes = db.prepare("SELECT 1 FROM sincronizacoes WHERE entidade_tipo = 'usuario' AND entidade_id = ?").get(u.id);
  if (!antes) { enfileirar('usuario', u.id); countUsuarios++; }
}
console.log(`[force-resync] ${countUsuarios} usuários enfileirados (de ${usuarios.length} totais).`);

// 4. Enfileira evidências (alertas dependem delas via foto_id)
const evidencias = db.prepare('SELECT id FROM evidencias').all() as { id: string }[];
let countEvidencias = 0;
for (const e of evidencias) {
  const antes = db.prepare("SELECT 1 FROM sincronizacoes WHERE entidade_tipo = 'evidencia' AND entidade_id = ?").get(e.id);
  if (!antes) { enfileirar('evidencia', e.id); countEvidencias++; }
}
console.log(`[force-resync] ${countEvidencias} evidências enfileiradas (de ${evidencias.length} totais).`);

// 5. Enfileira tarefas, movimentações e alertas (filhos)
for (const tipo of ['tarefa', 'movimentacao', 'alerta'] as const) {
  const tabela = tipo === 'tarefa' ? 'tarefas' : tipo === 'movimentacao' ? 'movimentacoes' : 'alertas';
  const rows = db.prepare(`SELECT id FROM ${tabela}`).all() as { id: string }[];
  let count = 0;
  for (const r of rows) {
    const antes = db.prepare("SELECT 1 FROM sincronizacoes WHERE entidade_tipo = ? AND entidade_id = ?").get(tipo, r.id);
    if (!antes) { enfileirar(tipo, r.id); count++; }
  }
  console.log(`[force-resync] ${count} ${tipo}s enfileirados (de ${rows.length} totais).`);
}

// 6. Estatísticas finais
const fila = db.prepare(
  `SELECT entidade_tipo, COUNT(*) AS n FROM sincronizacoes WHERE status_envio = 'PENDENTE' GROUP BY entidade_tipo`
).all() as { entidade_tipo: string; n: number }[];

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('🔁 FILA DE SYNC ATUALIZADA');
console.log('═══════════════════════════════════════════════════════');
fila.forEach(r => console.log(`  ${r.entidade_tipo.padEnd(13)} ${r.n}`));
console.log('');
console.log('Reinicia o servidor (npm run dev) que o cloudSync vai subir');
console.log('os retiros → usuários → evidências → tarefas/movs/alertas');
console.log('respeitando as FKs do Supabase.');
