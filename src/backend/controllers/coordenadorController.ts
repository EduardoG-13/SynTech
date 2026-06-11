import { Request, Response } from 'express';
import db from '../config/database';

/**
 * coordenadorController.ts
 * Fluxo do Coordenador: aprovar/rejeitar boletas e exportar CSV.
 *
 * Regras (project_business_rules_v2):
 * - Coordenador é quem APROVA (não o Gerente).
 * - Coordenador pode exportar CSV individual ou múltiplo.
 * - Gerente recebe relatório consolidado mensal (não vê boleta a boleta).
 */

interface SessUsuario {
  id: string;
  perfil: string;
}

/**
 * IDs dos retiros sob responsabilidade do Coordenador logado.
 * Gerente vê todos → retorna `null` (sem filtro).
 * Para transferências, o coordenador vê se o retiro de origem OU destino é dele.
 */
function getRetirosDoCoordenador(sess: SessUsuario): string[] | null {
  if (sess.perfil === 'Gerente') return null;
  const rows = db.prepare(
    'SELECT id FROM retiros WHERE coordenador_id = ?'
  ).all(sess.id) as { id: string }[];
  return rows.map((r) => r.id);
}

// ============ APROVAÇÃO ============

// GET /api/coordenador/boletas-pendentes
export function listarBoletasPendentes(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const retirosPermitidos = getRetirosDoCoordenador(sess);

  // Debug log: quantas boletas pendentes existem no total + quais retiros o coord gerencia
  const totalPendentes = (db.prepare(
    "SELECT COUNT(*) AS n FROM movimentacoes WHERE aprovado_por_coordenador_id IS NULL"
  ).get() as any).n;
  console.log(`[listarBoletasPendentes] usuario=${sess.id} perfil=${sess.perfil} ` +
    `retirosGerenciados=${JSON.stringify(retirosPermitidos)} totalPendentes=${totalPendentes}`);

  let sql = `
    SELECT m.*, u.nome AS capataz_nome, r.nome AS retiro_nome
    FROM movimentacoes m
    LEFT JOIN usuarios u ON u.id = m.capataz_id
    LEFT JOIN retiros r ON r.id = m.retiro_id
    WHERE m.aprovado_por_coordenador_id IS NULL
  `;
  const params: any[] = [];

  if (retirosPermitidos !== null) {
    if (retirosPermitidos.length === 0) {
      // Coordenador não responsável por nenhum retiro — não vê nada
      console.log('[listarBoletasPendentes] coordenador sem retiros atribuídos');
      return res.json([]);
    }
    const ph = retirosPermitidos.map(() => '?').join(',');
    // Cobre tanto operações simples (retiro_id) quanto transferências (origem/destino)
    sql += ` AND (m.retiro_id IN (${ph})
              OR m.retiro_origem_id IN (${ph})
              OR m.retiro_destino_id IN (${ph}))`;
    params.push(...retirosPermitidos, ...retirosPermitidos, ...retirosPermitidos);
  }

  sql += ' ORDER BY m.criado_em DESC';
  const rows = db.prepare(sql).all(...params) as any[];

  // Agrupa por grupo_id (1 boleta = N rows de categorias)
  const grupos: Record<string, any> = {};
  for (const r of rows) {
    const key = r.grupo_id || r.id;
    if (!grupos[key]) {
      grupos[key] = {
        ...r,
        id: r.id, // mantém o ID da row pra aprovar
        grupo_id: key,
        animais: [],
      };
    }
    grupos[key].animais.push({ categoria: r.categoria, quantidade: r.quantidade });
  }
  const lista = Object.values(grupos);
  console.log(`[listarBoletasPendentes] retornando ${lista.length} boleta(s) agrupadas (de ${rows.length} rows)`);
  return res.json(lista);
}

// POST /api/coordenador/boletas/:id/aprovar
// Aceita tanto um id de row quanto um grupo_id (aprova todas as rows do grupo).
export function aprovarBoleta(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const idOuGrupo = String(req.params.id);
  // Busca todas as rows que compõem essa boleta (mesmo grupo_id)
  const rows = db.prepare(
    `SELECT id, retiro_id, retiro_origem_id, retiro_destino_id, grupo_id
     FROM movimentacoes
     WHERE id = ? OR grupo_id = ?`
  ).all(idOuGrupo, idOuGrupo) as any[];

  if (rows.length === 0) return res.status(404).json({ erro: 'Boleta não encontrada.' });

  // Verifica permissão usando qualquer das rows (todas pertencem ao mesmo grupo/retiro)
  const retirosPermitidos = getRetirosDoCoordenador(sess);
  if (retirosPermitidos !== null) {
    const envolvidos = new Set<string>();
    for (const r of rows) {
      if (r.retiro_id) envolvidos.add(r.retiro_id);
      if (r.retiro_origem_id) envolvidos.add(r.retiro_origem_id);
      if (r.retiro_destino_id) envolvidos.add(r.retiro_destino_id);
    }
    const podeAprovar = Array.from(envolvidos).some((rId) => retirosPermitidos.includes(rId));
    if (!podeAprovar) {
      return res.status(403).json({ erro: 'Você não é o coordenador responsável por nenhum retiro envolvido nesta boleta.' });
    }
  }

  // Aprova TODAS as rows da boleta (mesmo grupo_id)
  const stmt = db.prepare(`
    UPDATE movimentacoes
    SET aprovado_por_coordenador_id = ?, aprovado_em = datetime('now'), validado = 1
    WHERE id = ?
  `);
  for (const r of rows) stmt.run(sess.id, r.id);

  return res.json({ mensagem: 'Boleta aprovada.', linhas_atualizadas: rows.length });
}

// ============ EXPORTAÇÃO CSV ============

interface FiltrosExport {
  tipos?: string;        // ex: "nascimento,obito"
  retiro_id?: string;
  data_inicio?: string;  // YYYY-MM-DD
  data_fim?: string;     // YYYY-MM-DD
  ids?: string;          // ex: "id1,id2,id3" — exportação seletiva
  somente_aprovadas?: string; // "1" para filtrar
}

/**
 * GET /api/coordenador/exportar?...
 * Gera um CSV com o layout da planilha BRPec (reference_planilha_brpec):
 * Retiro, Data, Tipo, Categoria, Quantidade, Origem, Destino, Mês-Ano, Ano, Mês, Causa Morte, Obs, Fazenda
 */
export function exportarCsv(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).send('Não autenticado.');

  const f = req.query as unknown as FiltrosExport;

  // WHERE dinâmico
  const conds: string[] = [];
  const params: any[] = [];

  // Filtro automático por retiros do coordenador
  const retirosPermitidos = getRetirosDoCoordenador(sess);
  if (retirosPermitidos !== null) {
    if (retirosPermitidos.length === 0) {
      return res.status(403).send('Você não gerencia nenhum retiro.');
    }
    const ph = retirosPermitidos.map(() => '?').join(',');
    conds.push(`(m.retiro_id IN (${ph}) OR m.retiro_origem_id IN (${ph}) OR m.retiro_destino_id IN (${ph}))`);
    params.push(...retirosPermitidos, ...retirosPermitidos, ...retirosPermitidos);
  }

  if (f.ids) {
    const idList = String(f.ids).split(',').filter(Boolean);
    if (idList.length === 0) {
      return res.status(400).send('Nenhum ID válido informado.');
    }
    const placeholders = idList.map(() => '?').join(',');
    conds.push(`m.id IN (${placeholders})`);
    params.push(...idList);
  }
  if (f.retiro_id) { conds.push('m.retiro_id = ?'); params.push(String(f.retiro_id)); }
  if (f.data_inicio) { conds.push('m.data >= ?'); params.push(String(f.data_inicio)); }
  if (f.data_fim) { conds.push('m.data <= ?'); params.push(String(f.data_fim)); }
  if (f.somente_aprovadas === '1') { conds.push('m.aprovado_por_coordenador_id IS NOT NULL'); }

  // Filtro por tipo via JOIN com as tabelas especializadas (sem subquery pesada)
  // Aqui simplificamos: lemos todas e filtramos em memória pelo tipo da especialização

  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  const sql = `
    SELECT m.*, r.nome AS retiro_nome, u.nome AS capataz_nome,
           (SELECT 'nascimento' FROM nascimentos n WHERE n.movimentacao_id = m.id LIMIT 1) AS t_nasc,
           (SELECT 'obito'      FROM obitos      o WHERE o.movimentacao_id = m.id LIMIT 1) AS t_obito,
           (SELECT 'transferencia' FROM transferencias tr WHERE tr.movimentacao_id = m.id LIMIT 1) AS t_transf,
           (SELECT 'compravenda' FROM compravendas c WHERE c.movimentacao_id = m.id LIMIT 1) AS t_cv,
           (SELECT tr2.retiro_origem_id  FROM transferencias tr2 WHERE tr2.movimentacao_id = m.id LIMIT 1) AS origem_id,
           (SELECT tr3.retiro_destino_id FROM transferencias tr3 WHERE tr3.movimentacao_id = m.id LIMIT 1) AS destino_id,
           (SELECT o.causa_morte FROM obitos o WHERE o.movimentacao_id = m.id LIMIT 1) AS causa_morte
    FROM movimentacoes m
    LEFT JOIN retiros r ON r.id = m.retiro_id
    LEFT JOIN usuarios u ON u.id = m.capataz_id
    ${where}
    ORDER BY m.data DESC
  `;
  const rows = db.prepare(sql).all(...params) as any[];

  // Filtra tipos selecionados
  const tiposSelecionados = f.tipos ? String(f.tipos).split(',').filter(Boolean) : null;

  const csvRows: string[] = [];
  // Cabeçalho exatamente como na planilha BRPec
  csvRows.push([
    'Retiro', 'Data', 'Tipo', 'Categoria', 'Quantidade',
    'Origem', 'Destino', 'Mês-Ano', 'Ano', 'Mês',
    'Causa Morte', 'Obs', 'Fazenda',
  ].map(escCsv).join(','));

  for (const m of rows) {
    const tipo = m.t_nasc || m.t_obito || m.t_transf || m.t_cv || 'manejo';
    if (tiposSelecionados && !tiposSelecionados.includes(tipo)) continue;

    const data = m.data || '';
    const [ano, mes] = (data ? String(data).split('-') : ['', '', '']);
    const mesAno = (ano && mes) ? `${parseInt(mes)}-${ano}` : '';
    const origemNome = m.origem_id ? (db.prepare('SELECT nome FROM retiros WHERE id = ?').get(m.origem_id) as any)?.nome || '' : '';
    const destinoNome = m.destino_id ? (db.prepare('SELECT nome FROM retiros WHERE id = ?').get(m.destino_id) as any)?.nome || '' : '';

    csvRows.push([
      m.retiro_nome || '',
      data,
      tipoLabel(tipo),
      m.categoria || '',
      m.quantidade ?? '',
      origemNome,
      destinoNome,
      mesAno,
      ano || '',
      mes ? String(parseInt(mes)) : '',
      m.causa_morte || '',
      '', // Obs (campo livre, não temos no modelo atual)
      'BRPEC',
    ].map(escCsv).join(','));
  }

  const csv = '﻿' + csvRows.join('\n');  // BOM para Excel detectar UTF-8
  const filename = f.ids
    ? `boleta_${String(f.ids).slice(0, 8)}.csv`
    : `boletas_${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(csv);
}

function tipoLabel(tipo: string) {
  return {
    nascimento: 'NASCIMENTO',
    obito: 'MORTE',
    transferencia: 'TRANSF. SAÍDA INTERNA',
    compravenda: 'COMPRAS',
    manejo: 'MANEJO',
  }[tipo] || tipo.toUpperCase();
}

function escCsv(v: string | number | null | undefined) {
  const s = (v === null || v === undefined) ? '' : String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
