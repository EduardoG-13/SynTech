/**
 * seed-update-photos.ts
 * Substitui as fotos placeholder (10x10 px) no banco por fotos realistas
 * de gado/campo geradas para a demo.
 *
 * Rodar DEPOIS do seed-demo.ts:
 *   npx ts-node src/backend/seed-update-photos.ts
 */

import db from './config/database';
import { inicializarBanco } from './config/initDb';
import fs from 'fs';
import path from 'path';

inicializarBanco();

const DEMO_DIR = path.resolve(__dirname, '../../src/public/demo-images');

function toDataUrl(filename: string): string {
  const filePath = path.join(DEMO_DIR, filename);
  const buf = fs.readFileSync(filePath);
  return 'data:image/png;base64,' + buf.toString('base64');
}

// Carrega fotos realistas
const fotos = {
  nascimento: toDataUrl('newborn_calf.png'),
  obito: toDataUrl('dead_cattle.png'),
  transferencia: toDataUrl('cattle_truck.png'),
  pasto: toDataUrl('cattle_pasture.png'),
  infraHidraulica: toDataUrl('broken_infrastructure.png'),
  infraCerca: toDataUrl('broken_fence.png'),
  infraEletrica: toDataUrl('electric_fence.png'),
};

console.log('[seed-photos] Fotos carregadas, atualizando banco...');

// 1. Atualizar fotos de boletas (movimentacoes) com fotos realistas
// Nascimentos -> foto de bezerro
db.prepare(`
  UPDATE movimentacoes SET foto_base64 = ? 
  WHERE tipo_operacao = 'nascimento' AND tem_foto = 1
`).run(fotos.nascimento);

// Óbitos -> foto de carcaça (distante)
db.prepare(`
  UPDATE movimentacoes SET foto_base64 = ? 
  WHERE tipo_operacao = 'obito' AND tem_foto = 1
`).run(fotos.obito);

// Transferências -> foto de caminhão boiadeiro
db.prepare(`
  UPDATE movimentacoes SET foto_base64 = ? 
  WHERE tipo_operacao = 'transferencia' AND tem_foto = 1
`).run(fotos.transferencia);

// Compra/venda e evolução -> foto de pasto com gado
db.prepare(`
  UPDATE movimentacoes SET foto_base64 = ? 
  WHERE tipo_operacao IN ('compravenda', 'evolucao', 'manejo') AND tem_foto = 1
`).run(fotos.pasto);

console.log('[seed-photos] ✅ Fotos de boletas atualizadas.');

// 2. Atualizar fotos de tarefas com fotos realistas
db.prepare(`
  UPDATE tarefas SET foto_base64 = ? 
  WHERE tipo_operacao = 'nascimento' AND foto_base64 IS NOT NULL
`).run(fotos.nascimento);

db.prepare(`
  UPDATE tarefas SET foto_base64 = ? 
  WHERE tipo_operacao IN ('obito') AND foto_base64 IS NOT NULL
`).run(fotos.obito);

db.prepare(`
  UPDATE tarefas SET foto_base64 = ? 
  WHERE tipo_operacao IN ('transferencia', 'compravenda', 'evolucao', 'manejo') AND foto_base64 IS NOT NULL
`).run(fotos.pasto);

console.log('[seed-photos] ✅ Fotos de tarefas atualizadas.');

// 3. Atualizar evidências de chamados com fotos realistas por tipo
// Obter alertas com evidência e atualizar baseado no tipo do alerta
const alertasComFoto = db.prepare(`
  SELECT a.id AS alerta_id, a.tipo, a.foto_id 
  FROM alertas a 
  WHERE a.foto_id IS NOT NULL
`).all() as { alerta_id: string; tipo: string; foto_id: string }[];

for (const alerta of alertasComFoto) {
  let fotoBase64: string;
  switch (alerta.tipo) {
    case 'hidraulica':
      fotoBase64 = fotos.infraHidraulica;
      break;
    case 'cerca':
      fotoBase64 = fotos.infraCerca;
      break;
    case 'eletrica':
      fotoBase64 = fotos.infraEletrica;
      break;
    default:
      fotoBase64 = fotos.infraHidraulica;
  }
  db.prepare(`UPDATE evidencias SET arquivo_base64 = ? WHERE id = ?`).run(fotoBase64, alerta.foto_id);
}

console.log(`[seed-photos] ✅ ${alertasComFoto.length} fotos de chamados atualizadas.`);

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('📸 FOTOS REALISTAS APLICADAS COM SUCESSO');
console.log('═══════════════════════════════════════════════════════');
console.log('Agora ao abrir boletas e chamados no app, as fotos');
console.log('serão imagens reais de gado, cercas quebradas etc.');
console.log('');
