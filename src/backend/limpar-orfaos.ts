/**
 * limpar-orfaos.ts
 * Remove dados de teste (IDs com prefixo 'test-') e registros órfãos
 * (cujas FKs apontam pra usuários/retiros inexistentes).
 *
 * Como rodar:
 *   npx ts-node src/backend/limpar-orfaos.ts
 *   ou: npm run db:limpar
 */

import db from './config/database';
import { v7 as uuidv7 } from 'uuid';
import { inicializarBanco } from './config/initDb';

inicializarBanco();

console.log('[limpar] Iniciando limpeza de órfãos e dados de teste...');

// 1) IDs de teste (prefixo 'test-')
const t1 = db.prepare("DELETE FROM sincronizacoes WHERE entidade_id LIKE 'test-%'").run();
const t2 = db.prepare("DELETE FROM movimentacoes WHERE capataz_id LIKE 'test-%' OR retiro_id LIKE 'test-%'").run();
const t3 = db.prepare("DELETE FROM tarefas WHERE capataz_id LIKE 'test-%' OR retiro_id LIKE 'test-%' OR gerente_id LIKE 'test-%'").run();
const t4 = db.prepare("DELETE FROM alertas WHERE capataz_id LIKE 'test-%' OR retiro_id LIKE 'test-%'").run();
const t5 = db.prepare("DELETE FROM usuarios WHERE id LIKE 'test-%'").run();
const t6 = db.prepare("DELETE FROM retiros WHERE id LIKE 'test-%'").run();
const totalTeste = Number(t1.changes) + Number(t2.changes) + Number(t3.changes) + Number(t4.changes) + Number(t5.changes) + Number(t6.changes);
console.log(`[limpar] IDs de teste: ${totalTeste} registros removidos`);

// 2) Movimentações órfãs (capataz_id ou retiro_id que não existe)
const movsOrfas = db.prepare(`
  SELECT m.id
  FROM movimentacoes m
  LEFT JOIN usuarios u ON u.id = m.capataz_id
  LEFT JOIN retiros  r ON r.id = m.retiro_id
  WHERE u.id IS NULL OR r.id IS NULL
`).all() as { id: string }[];
const stmtDelMov = db.prepare('DELETE FROM movimentacoes WHERE id = ?');
const stmtDelSyncMov = db.prepare("DELETE FROM sincronizacoes WHERE entidade_id = ? AND entidade_tipo = 'movimentacao'");
movsOrfas.forEach((o) => { stmtDelMov.run(o.id); stmtDelSyncMov.run(o.id); });
console.log(`[limpar] Movimentações órfãs: ${movsOrfas.length} removidas`);

// 3) Tarefas órfãs
const tarefasOrfas = db.prepare(`
  SELECT t.id
  FROM tarefas t
  LEFT JOIN usuarios u ON u.id = t.capataz_id
  LEFT JOIN retiros  r ON r.id = t.retiro_id
  WHERE u.id IS NULL OR r.id IS NULL
`).all() as { id: string }[];
const stmtDelTarefa = db.prepare('DELETE FROM tarefas WHERE id = ?');
const stmtDelSyncTarefa = db.prepare("DELETE FROM sincronizacoes WHERE entidade_id = ? AND entidade_tipo = 'tarefa'");
tarefasOrfas.forEach((o) => { stmtDelTarefa.run(o.id); stmtDelSyncTarefa.run(o.id); });
console.log(`[limpar] Tarefas órfãs: ${tarefasOrfas.length} removidas`);

// 4) Alertas órfãos
const alertasOrfaos = db.prepare(`
  SELECT a.id
  FROM alertas a
  LEFT JOIN usuarios u ON u.id = a.capataz_id
  LEFT JOIN retiros  r ON r.id = a.retiro_id
  WHERE u.id IS NULL OR r.id IS NULL
`).all() as { id: string }[];
const stmtDelAlerta = db.prepare('DELETE FROM alertas WHERE id = ?');
const stmtDelSyncAlerta = db.prepare("DELETE FROM sincronizacoes WHERE entidade_id = ? AND entidade_tipo = 'alerta'");
alertasOrfaos.forEach((o) => { stmtDelAlerta.run(o.id); stmtDelSyncAlerta.run(o.id); });
console.log(`[limpar] Alertas órfãos: ${alertasOrfaos.length} removidos`);

// 5) Remove entradas da fila que apontam pra registros que não existem mais localmente
const orfasNaFila = db.prepare(`
  SELECT s.id, s.entidade_tipo, s.entidade_id FROM sincronizacoes s
  WHERE s.status_envio IN ('PENDENTE', 'ERRO')
    AND (
      (s.entidade_tipo = 'retiro'       AND NOT EXISTS (SELECT 1 FROM retiros       WHERE id = s.entidade_id))
   OR (s.entidade_tipo = 'usuario'      AND NOT EXISTS (SELECT 1 FROM usuarios      WHERE id = s.entidade_id))
   OR (s.entidade_tipo = 'evidencia'    AND NOT EXISTS (SELECT 1 FROM evidencias    WHERE id = s.entidade_id))
   OR (s.entidade_tipo = 'tarefa'       AND NOT EXISTS (SELECT 1 FROM tarefas       WHERE id = s.entidade_id))
   OR (s.entidade_tipo = 'movimentacao' AND NOT EXISTS (SELECT 1 FROM movimentacoes WHERE id = s.entidade_id))
   OR (s.entidade_tipo = 'alerta'       AND NOT EXISTS (SELECT 1 FROM alertas       WHERE id = s.entidade_id))
    )
`).all() as any[];
const stmtDelSync = db.prepare('DELETE FROM sincronizacoes WHERE id = ?');
orfasNaFila.forEach((o) => stmtDelSync.run(o.id));
console.log(`[limpar] Entradas órfãs na fila (registros já deletados): ${orfasNaFila.length} removidas`);

// 6) Reset itens com ERRO pra tentarem novamente
const reset = db.prepare("UPDATE sincronizacoes SET status_envio = 'PENDENTE', tentativas = 0 WHERE status_envio = 'ERRO'").run();
console.log(`[limpar] ${reset.changes} sincronizações com ERRO reenfileiradas`);

// 6) Pra cada movimentação/tarefa/alerta na fila, garante que os parents também estão na fila.
//    Resolve o caso "pai já foi marcado SUCESSO mas o Supabase não tem ele" (ex: limpou Supabase manualmente).
function reenfileirar(tipo: string, id: string) {
  // Remove qualquer entrada anterior (SUCESSO/ERRO/PENDENTE) e insere fresh PENDENTE
  db.prepare("DELETE FROM sincronizacoes WHERE entidade_tipo = ? AND entidade_id = ?").run(tipo, id);
  db.prepare(`INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas) VALUES (?, ?, ?, 'PENDENTE', 0)`).run(uuidv7(), tipo, id);
}

const pendentesChildren = db.prepare(`
  SELECT entidade_tipo, entidade_id FROM sincronizacoes
  WHERE status_envio = 'PENDENTE'
    AND entidade_tipo IN ('movimentacao', 'tarefa', 'alerta')
`).all() as { entidade_tipo: string; entidade_id: string }[];

const usuariosReenfileirados = new Set<string>();
const retirosReenfileirados = new Set<string>();
const evidenciasReenfileiradas = new Set<string>();

for (const item of pendentesChildren) {
  let row: any = null;
  if (item.entidade_tipo === 'movimentacao') {
    row = db.prepare('SELECT capataz_id, retiro_id, retiro_origem_id, retiro_destino_id FROM movimentacoes WHERE id = ?').get(item.entidade_id);
  } else if (item.entidade_tipo === 'tarefa') {
    row = db.prepare('SELECT capataz_id, retiro_id, gerente_id FROM tarefas WHERE id = ?').get(item.entidade_id);
  } else if (item.entidade_tipo === 'alerta') {
    row = db.prepare('SELECT capataz_id, retiro_id, tecnico_id, foto_id FROM alertas WHERE id = ?').get(item.entidade_id);
  }
  if (!row) continue;

  ['capataz_id', 'gerente_id', 'tecnico_id'].forEach((k) => {
    if (row[k] && !usuariosReenfileirados.has(row[k])) {
      reenfileirar('usuario', row[k]);
      usuariosReenfileirados.add(row[k]);
    }
  });
  ['retiro_id', 'retiro_origem_id', 'retiro_destino_id'].forEach((k) => {
    if (row[k] && !retirosReenfileirados.has(row[k])) {
      reenfileirar('retiro', row[k]);
      retirosReenfileirados.add(row[k]);
    }
  });
  if (row['foto_id'] && !evidenciasReenfileiradas.has(row['foto_id'])) {
    reenfileirar('evidencia', row['foto_id']);
    evidenciasReenfileiradas.add(row['foto_id']);
  }
}
console.log(`[limpar] Parents reenfileirados pra garantir ordem: ${usuariosReenfileirados.size} usuários + ${retirosReenfileirados.size} retiros + ${evidenciasReenfileiradas.size} evidências`);

// 6) Resumo final
const fila = db.prepare(
  "SELECT entidade_tipo, COUNT(*) AS n FROM sincronizacoes WHERE status_envio = 'PENDENTE' GROUP BY entidade_tipo"
).all() as { entidade_tipo: string; n: number }[];

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('🧹 LIMPEZA CONCLUÍDA — fila de sync atual:');
console.log('═══════════════════════════════════════════════════════');
if (fila.length === 0) {
  console.log('  Fila vazia. Tudo já sincronizado.');
} else {
  fila.forEach((r) => console.log(`  ${r.entidade_tipo.padEnd(13)} ${r.n}`));
}
