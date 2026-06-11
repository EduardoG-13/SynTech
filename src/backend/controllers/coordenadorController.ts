import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import db from '../config/database';

/**
 * coordenadorController.ts
 * Fluxo do Coordenador: aprovar/rejeitar boletas, exportar planilha (XLSX) e PDF individual.
 *
 * Regras (project_business_rules_v2):
 * - Coordenador é quem APROVA (não o Gerente).
 * - Coordenador pode exportar XLSX consolidada ou PDF individual.
 * - Gerente também pode exportar (acesso de auditoria).
 */

interface SessUsuario {
  id: string;
  perfil: string;
}

function getRetirosDoCoordenador(sess: SessUsuario): string[] | null {
  if (sess.perfil === 'Gerente') return null;
  const rows = db.prepare(
    'SELECT id FROM retiros WHERE coordenador_id = ?'
  ).all(sess.id) as { id: string }[];
  return rows.map((r) => r.id);
}

// ============ APROVAÇÃO ============

export function listarBoletasPendentes(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const retirosPermitidos = getRetirosDoCoordenador(sess);

  let sql = `
    SELECT m.*, u.nome AS capataz_nome, r.nome AS retiro_nome
    FROM movimentacoes m
    LEFT JOIN usuarios u ON u.id = m.capataz_id
    LEFT JOIN retiros r ON r.id = m.retiro_id
    WHERE m.aprovado_por_coordenador_id IS NULL
  `;
  const params: any[] = [];

  if (retirosPermitidos !== null) {
    if (retirosPermitidos.length === 0) return res.json([]);
    const ph = retirosPermitidos.map(() => '?').join(',');
    sql += ` AND (m.retiro_id IN (${ph})
              OR m.retiro_origem_id IN (${ph})
              OR m.retiro_destino_id IN (${ph}))`;
    params.push(...retirosPermitidos, ...retirosPermitidos, ...retirosPermitidos);
  }

  sql += ' ORDER BY m.criado_em DESC';
  const rows = db.prepare(sql).all(...params) as any[];

  const grupos: Record<string, any> = {};
  for (const r of rows) {
    const key = r.grupo_id || r.id;
    if (!grupos[key]) {
      grupos[key] = { ...r, id: r.id, grupo_id: key, animais: [] };
    }
    grupos[key].animais.push({ categoria: r.categoria, quantidade: r.quantidade });
  }
  return res.json(Object.values(grupos));
}

export function aprovarBoleta(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const idOuGrupo = String(req.params.id);
  const rows = db.prepare(
    `SELECT id, retiro_id, retiro_origem_id, retiro_destino_id, grupo_id
     FROM movimentacoes WHERE id = ? OR grupo_id = ?`
  ).all(idOuGrupo, idOuGrupo) as any[];

  if (rows.length === 0) return res.status(404).json({ erro: 'Boleta não encontrada.' });

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
      return res.status(403).json({ erro: 'Você não é o coordenador responsável por nenhum retiro envolvido.' });
    }
  }

  const stmt = db.prepare(`
    UPDATE movimentacoes
    SET aprovado_por_coordenador_id = ?, aprovado_em = datetime('now'), validado = 1
    WHERE id = ?
  `);
  for (const r of rows) stmt.run(sess.id, r.id);
  return res.json({ mensagem: 'Boleta aprovada.', linhas_atualizadas: rows.length });
}

// ============ EXPORTAÇÃO ============

interface FiltrosExport {
  tipos?: string;
  retiro_id?: string;
  data_inicio?: string;
  data_fim?: string;
  ids?: string;
  somente_aprovadas?: string;
}

const ROTULO_TIPO: Record<string, string> = {
  nascimento: 'NASCIMENTO',
  obito: 'MORTE',
  transferencia: 'TRANSF. SAÍDA INTERNA',
  compravenda: 'COMPRAS',
  manejo: 'MANEJO',
  evolucao: 'EVOLUÇÃO',
};

function buscarMovimentacoesParaExport(sess: SessUsuario, f: FiltrosExport) {
  const conds: string[] = [];
  const params: any[] = [];

  const retirosPermitidos = getRetirosDoCoordenador(sess);
  if (retirosPermitidos !== null) {
    if (retirosPermitidos.length === 0) return [];
    const ph = retirosPermitidos.map(() => '?').join(',');
    conds.push(`(m.retiro_id IN (${ph}) OR m.retiro_origem_id IN (${ph}) OR m.retiro_destino_id IN (${ph}))`);
    params.push(...retirosPermitidos, ...retirosPermitidos, ...retirosPermitidos);
  }

  if (f.ids) {
    const idList = String(f.ids).split(',').filter(Boolean);
    if (idList.length === 0) return [];
    const ph = idList.map(() => '?').join(',');
    // Aceita tanto id da row quanto grupo_id (exportação selecionada usa id da row, detalhe usa grupo_id)
    conds.push(`(m.id IN (${ph}) OR m.grupo_id IN (${ph}))`);
    params.push(...idList, ...idList);
  }

  // Filtro de retiro cobre transferências (origem/destino) também
  if (f.retiro_id) {
    conds.push('(m.retiro_id = ? OR m.retiro_origem_id = ? OR m.retiro_destino_id = ?)');
    params.push(String(f.retiro_id), String(f.retiro_id), String(f.retiro_id));
  }
  if (f.data_inicio) { conds.push('m.data >= ?'); params.push(String(f.data_inicio)); }
  if (f.data_fim) { conds.push('m.data <= ?'); params.push(String(f.data_fim)); }
  if (f.somente_aprovadas === '1') conds.push('m.aprovado_por_coordenador_id IS NOT NULL');

  // Filtro por tipo via tipo_operacao (coluna direta de movimentacoes — sem subqueries em tabelas vazias)
  const tiposSelecionados = f.tipos ? String(f.tipos).split(',').filter(Boolean) : null;
  if (tiposSelecionados && tiposSelecionados.length) {
    const ph = tiposSelecionados.map(() => '?').join(',');
    conds.push(`m.tipo_operacao IN (${ph})`);
    params.push(...tiposSelecionados);
  }

  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  const sql = `
    SELECT m.*,
           r.nome  AS retiro_nome,
           ro.nome AS origem_nome,
           rd.nome AS destino_nome,
           u.nome  AS capataz_nome
    FROM movimentacoes m
    LEFT JOIN retiros  r  ON r.id  = m.retiro_id
    LEFT JOIN retiros  ro ON ro.id = m.retiro_origem_id
    LEFT JOIN retiros  rd ON rd.id = m.retiro_destino_id
    LEFT JOIN usuarios u  ON u.id  = m.capataz_id
    ${where}
    ORDER BY m.data DESC, m.criado_em DESC
  `;
  return db.prepare(sql).all(...params) as any[];
}

function escCsv(v: string | number | null | undefined) {
  const s = (v === null || v === undefined) ? '' : String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const HEADERS_PLANILHA = [
  'Retiro', 'Data', 'Tipo', 'Categoria', 'Quantidade',
  'Origem', 'Destino', 'Mês-Ano', 'Ano', 'Mês',
  'Causa Morte', 'Obs', 'Fazenda',
];

function linhaParaPlanilha(m: any) {
  const tipo = (m.tipo_operacao || 'manejo') as string;
  const data = (m.data || '') as string;
  const [ano = '', mes = ''] = data ? String(data).split('-') : [];
  const mesAno = (ano && mes) ? `${parseInt(mes)}-${ano}` : '';
  return [
    m.retiro_nome || '',
    data,
    ROTULO_TIPO[tipo] || tipo.toUpperCase(),
    m.categoria || '',
    Number(m.quantidade) || 0,
    m.origem_nome || '',
    m.destino_nome || '',
    mesAno,
    ano,
    mes ? String(parseInt(mes)) : '',
    m.causa_morte || '',
    m.observacoes || '',
    'BRPEC',
  ];
}

/**
 * GET /api/coordenador/exportar?formato=xlsx|csv&...
 * Default: xlsx estilizado. ?formato=csv retorna CSV puro UTF-8 com BOM.
 * Layout segue planilha BRPec.
 */
export async function exportarCsv(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).send('Não autenticado.');

  const f = req.query as unknown as FiltrosExport & { formato?: string };
  const formato = (f.formato || 'xlsx').toLowerCase();
  const rows = buscarMovimentacoesParaExport(sess, req.query as any);

  if (formato === 'csv') {
    const linhas: string[] = [];
    linhas.push(HEADERS_PLANILHA.map(escCsv).join(','));
    for (const m of rows) {
      linhas.push(linhaParaPlanilha(m).map(escCsv).join(','));
    }
    if (rows.length > 0) {
      const total = rows.reduce((s, m) => s + (Number(m.quantidade) || 0), 0);
      linhas.push(['TOTAL', '', '', '', total, '', '', '', '', '', '', '', ''].map(escCsv).join(','));
    }
    const csv = '﻿' + linhas.join('\n');  // BOM para Excel detectar UTF-8
    const nomeCsv = f.ids
      ? `boletas_selecionadas_${new Date().toISOString().slice(0, 10)}.csv`
      : `boletas_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeCsv}"`);
    return res.send(csv);
  }

  // === XLSX estilizado ===

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BRPec';
  workbook.created = new Date();
  const ws = workbook.addWorksheet('Boletas', {
    properties: { defaultRowHeight: 18 },
    views: [{ state: 'frozen', ySplit: 3 }],
  });

  // Cabeçalho de título
  ws.mergeCells('A1:M1');
  const titulo = ws.getCell('A1');
  titulo.value = 'BRPec — Relatório de Boletas';
  titulo.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF1A4D2E' } };
  titulo.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 28;

  ws.mergeCells('A2:M2');
  const subt = ws.getCell('A2');
  const dt = new Date().toLocaleString('pt-BR');
  subt.value = `Gerado em ${dt} · ${rows.length} registro(s)`;
  subt.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF5C6B5D' } };
  subt.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(2).height = 18;

  // Cabeçalho de colunas
  const headerRow = ws.getRow(3);
  HEADERS_PLANILHA.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A4D2E' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1A4D2E' } },
      bottom: { style: 'medium', color: { argb: 'FF1A4D2E' } },
      left: { style: 'thin', color: { argb: 'FFD7DFD3' } },
      right: { style: 'thin', color: { argb: 'FFD7DFD3' } },
    };
  });
  headerRow.height = 24;

  ws.columns = [
    { width: 22 }, { width: 12 }, { width: 22 }, { width: 26 }, { width: 12 },
    { width: 20 }, { width: 20 }, { width: 12 }, { width: 8 }, { width: 8 },
    { width: 24 }, { width: 30 }, { width: 14 },
  ];

  // Linhas de dados
  rows.forEach((m, idx) => {
    const row = ws.addRow(linhaParaPlanilha(m));

    const zebra = idx % 2 === 0;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1B1B1B' } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: [5, 9, 10].includes(colNumber) ? 'center' : 'left',
        wrapText: true,
      };
      cell.border = {
        bottom: { style: 'hair', color: { argb: 'FFE5E5E0' } },
        left: { style: 'hair', color: { argb: 'FFEFEFEC' } },
        right: { style: 'hair', color: { argb: 'FFEFEFEC' } },
      };
      if (zebra) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFDFB' } };
      }
    });
    // Destaca a coluna "Tipo" em negrito
    row.getCell(3).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1A4D2E' } };
    row.height = 18;
  });

  // Rodapé total
  if (rows.length > 0) {
    const totalAnimais = rows.reduce((s, m) => s + (Number(m.quantidade) || 0), 0);
    const totalRow = ws.addRow(['TOTAL', '', '', '', totalAnimais, '', '', '', '', '', '', '', '']);
    totalRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D52' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'medium', color: { argb: 'FF1A4D2E' } } };
    });
    totalRow.height = 22;
  }

  const filename = f.ids
    ? `boletas_selecionadas_${new Date().toISOString().slice(0, 10)}.xlsx`
    : `boletas_${new Date().toISOString().slice(0, 10)}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

// ============ PDF INDIVIDUAL ============

/**
 * GET /api/coordenador/boleta/:grupo_id/pdf
 * Gera um PDF estilizado de UMA boleta (todas as rows do grupo).
 */
export function exportarBoletaPdf(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).send('Não autenticado.');

  const idOuGrupo = String(req.params.grupo_id);
  const rows = db.prepare(`
    SELECT m.*,
           r.nome  AS retiro_nome,
           ro.nome AS origem_nome,
           rd.nome AS destino_nome,
           u.nome  AS capataz_nome,
           c.nome  AS coord_nome
    FROM movimentacoes m
    LEFT JOIN retiros  r  ON r.id  = m.retiro_id
    LEFT JOIN retiros  ro ON ro.id = m.retiro_origem_id
    LEFT JOIN retiros  rd ON rd.id = m.retiro_destino_id
    LEFT JOIN usuarios u  ON u.id  = m.capataz_id
    LEFT JOIN usuarios c  ON c.id  = m.aprovado_por_coordenador_id
    WHERE m.id = ? OR m.grupo_id = ?
    ORDER BY m.criado_em ASC
  `).all(idOuGrupo, idOuGrupo) as any[];

  if (rows.length === 0) return res.status(404).send('Boleta não encontrada.');

  const retirosPermitidos = getRetirosDoCoordenador(sess);
  if (retirosPermitidos !== null) {
    const envolvidos = new Set<string>();
    for (const r of rows) {
      if (r.retiro_id) envolvidos.add(r.retiro_id);
      if (r.retiro_origem_id) envolvidos.add(r.retiro_origem_id);
      if (r.retiro_destino_id) envolvidos.add(r.retiro_destino_id);
    }
    const ok = Array.from(envolvidos).some((rId) => retirosPermitidos.includes(rId));
    if (!ok) return res.status(403).send('Sem permissão pra essa boleta.');
  }

  const first = rows[0];
  const tipo = first.tipo_operacao as string;
  const rotulo = ROTULO_TIPO[tipo] || tipo?.toUpperCase() || 'BOLETA';
  const totalAnimais = rows.reduce((s, m) => s + (Number(m.quantidade) || 0), 0);
  const filename = `boleta_${rotulo.replace(/\s+/g, '_').toLowerCase()}_${(first.data || '').replace(/-/g, '')}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  doc.pipe(res);

  // Cores
  const VERDE = '#1A4D2E';
  const VERDE_CLARO = '#E6F3EB';
  const CINZA = '#5C6B5D';
  const PRETO = '#1B1B1B';
  const LINHA = '#D7DFD3';

  // Cabeçalho — barra verde + título
  doc.rect(48, 48, doc.page.width - 96, 56).fill(VERDE);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(20).text('BRPec', 64, 64);
  doc.font('Helvetica').fontSize(10).text('Relatório de Boleta', 64, 88);
  doc.font('Helvetica-Bold').fontSize(11).text(rotulo, 0, 70, { align: 'right', width: doc.page.width - 64 });
  const dataEmissao = new Date().toLocaleString('pt-BR');
  doc.font('Helvetica').fontSize(8).text(`Emitido em ${dataEmissao}`, 0, 88, { align: 'right', width: doc.page.width - 64 });

  doc.moveDown(2);
  let y = 130;

  // Função utilitária para desenhar uma seção com título
  function secao(titulo: string) {
    y += 8;
    doc.fillColor(VERDE).font('Helvetica-Bold').fontSize(12).text(titulo, 48, y);
    y += 18;
    doc.moveTo(48, y).lineTo(doc.page.width - 48, y).strokeColor(LINHA).lineWidth(0.8).stroke();
    y += 10;
  }

  function linhaLabel(label: string, valor: string) {
    doc.fillColor(CINZA).font('Helvetica-Bold').fontSize(8).text(label.toUpperCase(), 56, y, { width: 140 });
    doc.fillColor(PRETO).font('Helvetica').fontSize(11).text(valor || '—', 200, y - 1, { width: 340 });
    y += 22;
  }

  // === Seção: Dados do registro ===
  secao('Dados do registro');
  linhaLabel('Tipo', rotulo);
  linhaLabel('Data', String(first.data || '—'));
  linhaLabel('Retiro', first.retiro_nome || '—');
  if (first.pasto) linhaLabel('Pasto', first.pasto);
  linhaLabel('Capataz', first.capataz_nome || '—');

  // === Seção: Transferência (se for o caso) ===
  if (first.retiro_origem_id || first.retiro_destino_id) {
    secao('Transferência');
    linhaLabel('Retiro de origem', first.origem_nome || '—');
    linhaLabel('Retiro de destino', first.destino_nome || '—');
    if (first.tipo_transporte) linhaLabel('Transporte', first.tipo_transporte);
    if (first.motorista) linhaLabel('Motorista', first.motorista);
    if (first.placa) linhaLabel('Placa', first.placa);
  }

  // === Seção: Óbito ===
  if (tipo === 'obito' && first.causa_morte) {
    secao('Detalhes do óbito');
    linhaLabel('Causa', first.causa_morte);
  }

  // === Seção: Animais (tabela) ===
  secao('Animais');
  // Cabeçalho da tabela
  const tableX = 56;
  const tableW = doc.page.width - 112;
  const colCatW = tableW * 0.7;
  const colQtdW = tableW * 0.3;

  doc.rect(tableX, y, tableW, 22).fill(VERDE_CLARO);
  doc.fillColor(VERDE).font('Helvetica-Bold').fontSize(9).text('CATEGORIA', tableX + 8, y + 7, { width: colCatW - 16 });
  doc.text('QUANTIDADE', tableX + colCatW, y + 7, { width: colQtdW - 8, align: 'right' });
  y += 22;

  // Linhas
  rows.forEach((r, i) => {
    if (i % 2 === 1) {
      doc.rect(tableX, y, tableW, 22).fill('#FAFDFB');
    }
    doc.fillColor(PRETO).font('Helvetica').fontSize(10)
       .text(r.categoria || '—', tableX + 8, y + 6, { width: colCatW - 16 });
    doc.font('Helvetica-Bold')
       .text(String(r.quantidade || 0), tableX + colCatW, y + 6, { width: colQtdW - 8, align: 'right' });
    y += 22;
    doc.moveTo(tableX, y).lineTo(tableX + tableW, y).strokeColor(LINHA).lineWidth(0.4).stroke();
  });

  // Linha de total
  doc.rect(tableX, y, tableW, 24).fill(VERDE);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10)
     .text('TOTAL', tableX + 8, y + 8, { width: colCatW - 16 });
  doc.text(String(totalAnimais), tableX + colCatW, y + 8, { width: colQtdW - 8, align: 'right' });
  y += 32;

  // === Seção: Observações ===
  if (first.observacoes) {
    secao('Observações');
    doc.fillColor(PRETO).font('Helvetica').fontSize(10).text(first.observacoes, 56, y, { width: doc.page.width - 112 });
    y = doc.y + 12;
  }

  // === Seção: Foto anexada ===
  if (first.foto_base64) {
    secao('Foto anexada');
    try {
      // Remove o prefixo data URI (data:image/png;base64,...) — PDFKit espera só o base64
      const raw = String(first.foto_base64).replace(/^data:[^;]+;base64,/, '');
      const buf = Buffer.from(raw, 'base64');
      const maxW = doc.page.width - 112;
      const maxH = 260;
      // Garante espaço na página; senão quebra
      if (y + maxH > doc.page.height - 80) {
        doc.addPage();
        y = 60;
      }
      doc.image(buf, 56, y, { fit: [maxW, maxH], align: 'center' });
      y += maxH + 12;
    } catch (e) {
      doc.fillColor(CINZA).font('Helvetica-Oblique').fontSize(9)
         .text('(Foto anexada mas não foi possível renderizar.)', 56, y, { width: doc.page.width - 112 });
      y += 20;
    }
  }

  // Garante espaço pra próxima seção
  if (y > doc.page.height - 200) { doc.addPage(); y = 60; }

  // === Seção: Status ===
  secao('Status de validação');
  const aprovada = !!first.aprovado_por_coordenador_id;
  linhaLabel('Aprovação', aprovada ? `✓ Aprovada por ${first.coord_nome || 'coordenador'}` : 'Aguardando aprovação');
  if (first.aprovado_em) linhaLabel('Aprovado em', String(first.aprovado_em));
  linhaLabel('Sincronização', first.sincronizado ? 'Enviado para a nuvem' : 'Pendente');

  // Rodapé
  const rodapeY = doc.page.height - 40;
  doc.moveTo(48, rodapeY).lineTo(doc.page.width - 48, rodapeY).strokeColor(LINHA).stroke();
  doc.fillColor(CINZA).font('Helvetica').fontSize(8)
     .text(`BRPec · ID do grupo: ${first.grupo_id || first.id}`, 48, rodapeY + 8, { width: doc.page.width - 96, align: 'left' });
  doc.text(`Gerado por: ${sess.perfil}`, 48, rodapeY + 8, { width: doc.page.width - 96, align: 'right' });

  doc.end();
}
