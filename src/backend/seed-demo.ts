/**
 * seed-demo.ts
 * Popula o banco com dados de demonstração:
 *  - ~40 boletas (movimentações) variadas em retiros, capatazes, tipos e datas
 *  - ~12 tarefas pré-agendadas pelo Gerente (algumas novas, vistas, em andamento, concluídas)
 *  - ~8 chamados de infraestrutura (hidráulica, elétrica, cerca) com fotos
 *  - Mix de aprovadas/pendentes pra mostrar dashboard, exportação CSV/XLSX/PDF.
 *
 * IDEMPOTENTE: usa INSERT OR IGNORE. Pode rodar quantas vezes quiser sem duplicar.
 *
 * Como rodar:
 *   npx ts-node src/backend/seed-demo.ts
 */

import db from './config/database';
import { v7 as uuidv7 } from 'uuid';
import { inicializarBanco } from './config/initDb';

inicializarBanco();

// ============ HELPERS ============

function diasAtras(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function diasFrente(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function aleatorio<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Mini placeholder PNG colorido (10x10 pixels). Pequeno o suficiente pra não pesar.
function fotoFake(cor: 'verde' | 'vermelha' | 'laranja' | 'azul'): string {
  const pngs: Record<string, string> = {
    // 10x10 verde
    verde: 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAJUlEQVR42mP8z8DwnwEPYBxVSAAEMA4qpYABKAFG5KhAAB8AAAEsBAdq2N3GAAAAAElFTkSuQmCC',
    // 10x10 vermelha
    vermelha: 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAJklEQVR42mP8z/D/PwMewMSAB4yqJBkFE2GgUgAGoNAYjQRSKQEAdtIDAUFCowEAAAAASUVORK5CYII=',
    // 10x10 laranja
    laranja: 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAKElEQVR42mP8z/D/PwMewMSAB4yqJBkFE2GgUgAGoNAYjQRSKQEAB7EDApPjwt4AAAAASUVORK5CYII=',
    // 10x10 azul
    azul: 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAJklEQVR42mP8H8DwnwEPYBxVSAAEMA4qpYABKAFG5KhAAB8AAAEsBAdq2N3GAAAAAElFTkSuQmCC',
  };
  return 'data:image/png;base64,' + pngs[cor];
}

function enfileirarSync(entidadeTipo: string, entidadeId: string) {
  db.prepare(
    `INSERT OR IGNORE INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
     VALUES (?, ?, ?, 'PENDENTE', 0)`
  ).run(uuidv7(), entidadeTipo, entidadeId);
}

// ============ COLETA DADOS EXISTENTES ============

const capatazes = db.prepare(
  "SELECT id, nome, retiro_id FROM usuarios WHERE perfil = 'Capataz' AND retiro_id IS NOT NULL"
).all() as { id: string; nome: string; retiro_id: string }[];

const coordenadores = db.prepare(
  "SELECT id, nome FROM usuarios WHERE perfil = 'Coordenador'"
).all() as { id: string; nome: string }[];

const gerentes = db.prepare(
  "SELECT id, nome FROM usuarios WHERE perfil = 'Gerente'"
).all() as { id: string; nome: string }[];

const retiros = db.prepare("SELECT id, nome FROM retiros").all() as { id: string; nome: string }[];

if (capatazes.length === 0 || gerentes.length === 0 || retiros.length === 0) {
  console.error('[seed-demo] Erro: rode primeiro `npx ts-node src/backend/seed.ts` pra popular usuários e retiros base.');
  process.exit(1);
}

console.log(`[seed-demo] Encontrados: ${capatazes.length} capatazes, ${coordenadores.length} coordenadores, ${gerentes.length} gerentes, ${retiros.length} retiros`);

// ============ 1. BOLETAS (MOVIMENTAÇÕES) ============

const categoriasNasc = ['Bezerro 0 a 7 meses', 'Bezerra 0 a 7 meses'];
const categoriasNov  = ['Garrote 8 a 12 meses', 'Garrote 13 a 24 meses', 'Novilha 8 a 12 meses', 'Novilha 13 a 24 meses'];
const categoriasAd   = ['Boi acima 36 meses', 'Vaca acima 36 meses', 'Touro reprodutor'];
const causasMorte = ['Acidente', 'Onça', 'Doenças', 'Raio', 'Fraqueza', 'Cobra', 'Desidratação', 'Parto'];
const racas = ['Nelore', 'Brangus', 'Brahman', 'Canchim'];

const insertMov = db.prepare(`
  INSERT OR IGNORE INTO movimentacoes (
    id, capataz_id, retiro_id, data, categoria, quantidade,
    tipo_operacao, grupo_id,
    pasto, observacoes, tem_foto, foto_base64,
    raca, brinco, causa_morte,
    tipo_negocio, valor_financeiro,
    retiro_origem_id, retiro_destino_id, tipo_transporte, motorista, rg_cpf_motorista, placa,
    titulo,
    sincronizado, validado,
    aprovado_por_coordenador_id, aprovado_em,
    criado_em
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?,
    ?, ?, ?, ?, ?, ?,
    ?,
    0, 0,
    ?, ?,
    ?
  )
`);

let countBoletas = 0;

function criarBoletaCompleta(opts: {
  capataz: { id: string; nome: string; retiro_id: string };
  tipo: string;
  diasAtras: number;
  categorias: { nome: string; qtd: number }[];
  extras?: any;
  aprovar?: boolean;
}) {
  const grupoId = uuidv7();
  const data = diasAtras(opts.diasAtras);
  const criadoEm = `${data} ${String(Math.floor(Math.random() * 12) + 6).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;
  const aprovadoPor = opts.aprovar ? aleatorio(coordenadores).id : null;
  const aprovadoEm = opts.aprovar ? `${data} 18:30:00` : null;
  const e = opts.extras || {};

  // Foto: óbito sempre tem; outros 40%
  const temFoto = opts.tipo === 'obito' || Math.random() < 0.4;
  const fotoCor = opts.tipo === 'obito' ? 'vermelha' : 'verde';
  const fotoBase64 = temFoto ? fotoFake(fotoCor as any) : null;

  opts.categorias.forEach((cat) => {
    const id = uuidv7();
    insertMov.run(
      id, opts.capataz.id, opts.capataz.retiro_id, data, cat.nome, cat.qtd,
      opts.tipo, grupoId,
      e.pasto || `Pasto ${Math.floor(Math.random() * 20) + 1}`,
      e.observacoes || null,
      temFoto ? 1 : 0,
      fotoBase64,
      e.raca || null, e.brinco || null, e.causa_morte || null,
      e.tipo_negocio || null, e.valor_financeiro || null,
      e.retiro_origem_id || null, e.retiro_destino_id || null,
      e.tipo_transporte || null, e.motorista || null, e.rg_cpf_motorista || null, e.placa || null,
      e.titulo || null,
      aprovadoPor, aprovadoEm,
      criadoEm,
    );
    enfileirarSync('movimentacao', id);
    countBoletas++;
  });
}

// === 12 nascimentos espalhados ===
for (let i = 0; i < 12; i++) {
  const cap = aleatorio(capatazes);
  criarBoletaCompleta({
    capataz: cap,
    tipo: 'nascimento',
    diasAtras: Math.floor(Math.random() * 28),
    categorias: [{ nome: aleatorio(categoriasNasc), qtd: Math.floor(Math.random() * 4) + 1 }],
    extras: { raca: aleatorio(racas), observacoes: 'Nascimento sem intercorrências.' },
    aprovar: Math.random() < 0.7,
  });
}

// === 10 óbitos com causa ===
for (let i = 0; i < 10; i++) {
  const cap = aleatorio(capatazes);
  criarBoletaCompleta({
    capataz: cap,
    tipo: 'obito',
    diasAtras: Math.floor(Math.random() * 28),
    categorias: [{ nome: aleatorio([...categoriasNov, ...categoriasAd]), qtd: 1 }],
    extras: {
      causa_morte: aleatorio(causasMorte),
      brinco: `BR-${1000 + Math.floor(Math.random() * 9000)}`,
      observacoes: 'Carcaça encontrada na rotina matinal.',
    },
    aprovar: Math.random() < 0.6,
  });
}

// === 8 transferências entre retiros ===
for (let i = 0; i < 8; i++) {
  const cap = aleatorio(capatazes);
  const destino = aleatorio(retiros.filter(r => r.id !== cap.retiro_id));
  criarBoletaCompleta({
    capataz: cap,
    tipo: 'transferencia',
    diasAtras: Math.floor(Math.random() * 25),
    categorias: [
      { nome: aleatorio(categoriasNov), qtd: Math.floor(Math.random() * 30) + 10 },
      { nome: aleatorio(categoriasNov), qtd: Math.floor(Math.random() * 20) + 5 },
    ],
    extras: {
      retiro_origem_id: cap.retiro_id,
      retiro_destino_id: destino.id,
      tipo_transporte: aleatorio(['rodoviario', 'comitiva']),
      motorista: aleatorio(['João Silva', 'Pedro Lima', 'Carlos Souza', 'Manoel Pinto']),
      rg_cpf_motorista: `${100 + Math.floor(Math.random() * 900)}.${100 + Math.floor(Math.random() * 900)}.${100 + Math.floor(Math.random() * 900)}-${10 + Math.floor(Math.random() * 90)}`,
      placa: `${aleatorio(['ABC', 'XYZ', 'BRP', 'MTS'])}-${1000 + Math.floor(Math.random() * 9000)}`,
      observacoes: 'Transferência entre retiros concluída.',
    },
    aprovar: Math.random() < 0.65,
  });
}

// === 6 compras/vendas ===
for (let i = 0; i < 6; i++) {
  const cap = aleatorio(capatazes);
  const tipoNeg = aleatorio(['compra', 'venda']);
  criarBoletaCompleta({
    capataz: cap,
    tipo: 'compravenda',
    diasAtras: Math.floor(Math.random() * 30),
    categorias: [{ nome: aleatorio(categoriasAd), qtd: Math.floor(Math.random() * 50) + 20 }],
    extras: {
      tipo_negocio: tipoNeg,
      valor_financeiro: Math.floor(Math.random() * 80000) + 15000,
      observacoes: tipoNeg === 'compra' ? 'Lote adquirido do produtor vizinho.' : 'Venda para frigorífico parceiro.',
    },
    aprovar: Math.random() < 0.7,
  });
}

// === 5 evoluções ===
for (let i = 0; i < 5; i++) {
  const cap = aleatorio(capatazes);
  criarBoletaCompleta({
    capataz: cap,
    tipo: 'evolucao',
    diasAtras: Math.floor(Math.random() * 25),
    categorias: [
      { nome: aleatorio(categoriasNov), qtd: Math.floor(Math.random() * 30) + 15 },
    ],
    extras: {
      observacoes: 'Reclassificação de categoria devido ao crescimento do rebanho.',
    },
    aprovar: Math.random() < 0.6,
  });
}

// === 4 manejos ===
for (let i = 0; i < 4; i++) {
  const cap = aleatorio(capatazes);
  criarBoletaCompleta({
    capataz: cap,
    tipo: 'manejo',
    diasAtras: Math.floor(Math.random() * 20),
    categorias: [{ nome: 'MANEJO', qtd: 0 }],
    extras: {
      titulo: aleatorio(['Vacinação bezerros', 'Vermifugação', 'Pesagem rebanho', 'Limpeza bebedouro']),
      observacoes: 'Manejo executado conforme protocolo.',
    },
    aprovar: Math.random() < 0.5,
  });
}

console.log(`[seed-demo] ✅ ${countBoletas} linhas de boleta criadas (em ${countBoletas / 2 | 0} grupos).`);

// ============ 2. TAREFAS PRÉ-AGENDADAS PELO GERENTE ============

const gerente = gerentes[0]; // admin é o gerente principal
const tiposTarefa = ['nascimento', 'obito', 'transferencia', 'compravenda', 'evolucao', 'manejo'];
const prioridades = ['alta', 'media', 'baixa'];

const insertTarefa = db.prepare(`
  INSERT OR IGNORE INTO tarefas (
    id, titulo, descricao, status, data_execucao,
    retiro_id, capataz_id, gerente_id, sincronizada,
    tipo_operacao, prioridade, observacoes, audio_base64, foto_base64,
    vista_em, criada_em, concluida_em
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const titulosTarefa: Record<string, string[]> = {
  nascimento: ['Registrar nascimentos do Pasto 5', 'Marcação de bezerros nascidos', 'Cadastrar partos da semana'],
  obito: ['Registrar óbito em Pasto 12', 'Lançar carcaça encontrada na cerca norte', 'Documentar perda de animal'],
  transferencia: ['Transferir lote pra Cristo', 'Mover bezerros pra Confinamento', 'Recebimento de gado de Aroeira'],
  compravenda: ['Registrar compra de lote', 'Lançar venda pro frigorífico'],
  evolucao: ['Reclassificar garrotes', 'Atualizar categoria de novilhas'],
  manejo: ['Vacinação aftosa', 'Vermifugação bezerros', 'Pesagem trimestral', 'Limpeza dos cochos'],
};

let countTarefas = 0;

// 3 NOVAS (PENDENTE + sem vista_em) — gera badge "NOVA"
for (let i = 0; i < 3; i++) {
  const cap = aleatorio(capatazes);
  const tipo = aleatorio(tiposTarefa);
  insertTarefa.run(
    uuidv7(),
    aleatorio(titulosTarefa[tipo] || ['Tarefa do dia']),
    'Tarefa criada pelo Gerente — favor executar até a data combinada.',
    'PENDENTE',
    diasFrente(Math.floor(Math.random() * 5) + 1),
    cap.retiro_id, cap.id, gerente.id,
    tipo, aleatorio(prioridades),
    'Verificar pasto, anotar achados e registrar boleta com fotos.',
    null,
    Math.random() < 0.3 ? fotoFake('laranja') : null,
    null, // vista_em NULL → badge NOVA
    new Date().toISOString().slice(0, 19).replace('T', ' '),
    null,
  );
  countTarefas++;
}

// 4 PENDENTES já vistas (sem badge NOVA)
for (let i = 0; i < 4; i++) {
  const cap = aleatorio(capatazes);
  const tipo = aleatorio(tiposTarefa);
  insertTarefa.run(
    uuidv7(),
    aleatorio(titulosTarefa[tipo] || ['Tarefa do dia']),
    'Já visualizada pelo capataz, ainda não iniciada.',
    'PENDENTE',
    diasFrente(Math.floor(Math.random() * 7)),
    cap.retiro_id, cap.id, gerente.id,
    tipo, aleatorio(prioridades),
    'Trabalho programado conforme rotina semanal.',
    null,
    Math.random() < 0.4 ? fotoFake('laranja') : null,
    `${diasAtras(1)} 14:23:00`, // vista_em definida
    `${diasAtras(2)} 09:10:00`,
    null,
  );
  countTarefas++;
}

// 2 EM_ANDAMENTO
for (let i = 0; i < 2; i++) {
  const cap = aleatorio(capatazes);
  const tipo = aleatorio(tiposTarefa);
  insertTarefa.run(
    uuidv7(),
    aleatorio(titulosTarefa[tipo] || ['Tarefa em andamento']),
    'Capataz iniciou mas ainda não concluiu.',
    'EM_ANDAMENTO',
    diasFrente(Math.floor(Math.random() * 3)),
    cap.retiro_id, cap.id, gerente.id,
    tipo, aleatorio(prioridades),
    'Em execução — completar até o fim do dia.',
    null, null,
    `${diasAtras(1)} 10:00:00`,
    `${diasAtras(3)} 08:00:00`,
    null,
  );
  countTarefas++;
}

// 3 CONCLUIDAS
for (let i = 0; i < 3; i++) {
  const cap = aleatorio(capatazes);
  const tipo = aleatorio(tiposTarefa);
  insertTarefa.run(
    uuidv7(),
    aleatorio(titulosTarefa[tipo] || ['Tarefa concluída']),
    'Já executada pelo capataz.',
    'CONCLUIDA',
    diasAtras(Math.floor(Math.random() * 7) + 1),
    cap.retiro_id, cap.id, gerente.id,
    tipo, aleatorio(prioridades),
    'Tarefa finalizada e boleta gerada.',
    null, null,
    `${diasAtras(5)} 09:00:00`,
    `${diasAtras(7)} 08:00:00`,
    `${diasAtras(2)} 16:45:00`,
  );
  countTarefas++;
}

console.log(`[seed-demo] ✅ ${countTarefas} tarefas criadas (3 novas, 4 vistas pendentes, 2 em andamento, 3 concluídas).`);

// ============ 3. CHAMADOS DE INFRAESTRUTURA ============

const tecnicos = db.prepare(
  "SELECT id, nome FROM usuarios WHERE perfil = 'Tecnico'"
).all() as { id: string; nome: string }[];

const insertAlerta = db.prepare(`
  INSERT OR IGNORE INTO alertas (
    id, tipo, descricao, status, capataz_id, retiro_id,
    latitude, longitude, criado_em, sincronizado,
    local_referencia, audio_base64,
    tecnico_id, solucao_resolucao, resolvido_em, foto_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
`);

const insertEvidencia = db.prepare(`
  INSERT OR IGNORE INTO evidencias (id, alerta_id, tipo, arquivo_base64, criada_em)
  VALUES (?, ?, 'FOTO', ?, ?)
`);

const chamadosFake = [
  {
    tipo: 'hidraulica',
    descricao: 'Bebedouro do pasto 8 vazando muito — gado sem água há 2h',
    local: 'Bebedouro principal do Pasto 8, perto da porteira norte',
    status: 'ABERTO',
  },
  {
    tipo: 'hidraulica',
    descricao: 'Encanamento estourado entre os pastos 3 e 4 — formou poça grande',
    local: 'Trecho entre pastos 3 e 4, ao lado do mata-burro',
    status: 'EM_ANDAMENTO',
  },
  {
    tipo: 'eletrica',
    descricao: 'Cerca elétrica da divisa leste sem energia — risco de fuga',
    local: 'Divisa leste com Fazenda São José, próximo ao corredor',
    status: 'ABERTO',
  },
  {
    tipo: 'eletrica',
    descricao: 'Painel solar da bomba do retiro caiu — bateria descarregou',
    local: 'Próximo ao curral central',
    status: 'RESOLVIDO',
  },
  {
    tipo: 'cerca',
    descricao: 'Mourão da cerca do pasto 11 quebrado — arame solto em 15m',
    local: 'Pasto 11, lado oeste, perto do brete',
    status: 'EM_ANDAMENTO',
  },
  {
    tipo: 'cerca',
    descricao: 'Cerca quebrada na divisa com a estrada — perigo de fuga',
    local: 'Divisa norte, estrada de chão',
    status: 'ABERTO',
  },
  {
    tipo: 'hidraulica',
    descricao: 'Bomba do poço artesiano fazendo barulho estranho',
    local: 'Casa de bomba ao lado do retiro',
    status: 'RESOLVIDO',
  },
  {
    tipo: 'eletrica',
    descricao: 'Iluminação do curral pifou — não dá pra trabalhar à noite',
    local: 'Curral central',
    status: 'ABERTO',
  },
];

let countChamados = 0;

chamadosFake.forEach((c, i) => {
  const cap = capatazes[i % capatazes.length];
  const alertaId = uuidv7();
  const criadoEm = `${diasAtras(Math.floor(Math.random() * 14) + 1)} ${String(7 + Math.floor(Math.random() * 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;
  // Foto de evidência (laranja pra infraestrutura)
  let fotoId: string | null = null;
  if (Math.random() < 0.7) {
    fotoId = uuidv7();
    insertEvidencia.run(fotoId, alertaId, fotoFake('laranja'), criadoEm);
  }
  const ehResolvido = c.status === 'RESOLVIDO';
  const tecnicoId = ehResolvido ? aleatorio(tecnicos)?.id || null : null;
  const solucao = ehResolvido ? 'Reparo concluído. Material substituído e testado. Tudo funcionando.' : null;
  const resolvidoEm = ehResolvido ? `${diasAtras(Math.floor(Math.random() * 3))} 15:00:00` : null;

  // Coordenadas do Pantanal (faixa real aproximada)
  const lat = -17.5 - Math.random() * 1.5;
  const lng = -57.0 - Math.random() * 1.5;

  insertAlerta.run(
    alertaId,
    c.tipo,
    c.descricao,
    c.status,
    cap.id,
    cap.retiro_id,
    lat,
    lng,
    criadoEm,
    c.local,
    null, // áudio
    tecnicoId,
    solucao,
    resolvidoEm,
    fotoId,
  );
  enfileirarSync('alerta', alertaId);
  countChamados++;
});

console.log(`[seed-demo] ✅ ${countChamados} chamados de infraestrutura criados (mix de abertos, em andamento, resolvidos).`);

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('🎉 SEED DE DEMO CONCLUÍDO');
console.log('═══════════════════════════════════════════════════════');
console.log(`  • Boletas:   ${countBoletas} linhas`);
console.log(`  • Tarefas:   ${countTarefas} (3 novas + 4 vistas + 2 andamento + 3 concluídas)`);
console.log(`  • Chamados:  ${countChamados} (com fotos de evidência)`);
console.log('');
console.log('Logins prontos pra demo:');
console.log('  • Gerente ADM:  admin / 123456');
console.log('  • Coordenador:  marcos / 123456 (ou outros 6 nomes)');
console.log('  • Capataz:      escolha o retiro na tela inicial');
console.log('  • Infra:        escolha categoria na tela inicial');
console.log('');
console.log('Pra gravar a tela / gerar planilha:');
console.log('  1. Login Capataz → /tarefas → vê badges "NOVA" + clica numa tarefa → Iniciar');
console.log('  2. Login Coordenador → /boletas → aprovações pendentes');
console.log('  3. Login Coordenador → /historico → Exportar XLSX / CSV');
console.log('  4. Login Coordenador → /boleta/:id → Baixar PDF individual');
console.log('  5. Login Gerente → /dashboard → gráficos');
console.log('  6. Login Gerente → /nova-tarefa → cria tarefa pra capataz');
console.log('  7. Login Infra → /infraestrutura → resolve chamado');
