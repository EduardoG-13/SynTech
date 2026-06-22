/**
 * backfill-numero-boleta.ts
 * Atribui numero_boleta (BOL-AAAA-NNNN) às boletas antigas que ainda não têm.
 * Idempotente: só preenche onde está NULL. Roda 1x após a migração 010.
 *
 *   npx ts-node src/backend/backfill-numero-boleta.ts
 */
import db from './config/database';
import { inicializarBanco } from './config/initDb';

inicializarBanco();

// Pega grupos sem número, na ordem cronológica (criado_em), agrupando por grupo_id
const grupos = db.prepare(`
  SELECT grupo_id, MIN(criado_em) AS criado_em, MIN(data) AS data
  FROM movimentacoes
  WHERE (numero_boleta IS NULL OR numero_boleta = '')
    AND grupo_id IS NOT NULL
  GROUP BY grupo_id
  ORDER BY MIN(criado_em) ASC
`).all() as { grupo_id: string; criado_em: string; data: string }[];

console.log(`[backfill] ${grupos.length} boletas sem número.`);

// Contador por ano, partindo do que já existe
const contadorPorAno: Record<string, number> = {};
function proximoNumero(ano: string): string {
  if (contadorPorAno[ano] === undefined) {
    const row = db.prepare(
      `SELECT COUNT(DISTINCT grupo_id) AS n FROM movimentacoes WHERE numero_boleta LIKE ?`
    ).get('BOL-' + ano + '-%') as any;
    contadorPorAno[ano] = row?.n || 0;
  }
  contadorPorAno[ano]++;
  return 'BOL-' + ano + '-' + String(contadorPorAno[ano]).padStart(4, '0');
}

const upd = db.prepare('UPDATE movimentacoes SET numero_boleta = ? WHERE grupo_id = ?');
let feitos = 0;
for (const g of grupos) {
  const ano = (g.data || g.criado_em || new Date().toISOString()).slice(0, 4);
  const numero = proximoNumero(ano);
  upd.run(numero, g.grupo_id);
  feitos++;
}

console.log(`[backfill] ✅ ${feitos} boletas numeradas.`);
