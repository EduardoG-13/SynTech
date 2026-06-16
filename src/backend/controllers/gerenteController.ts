import { Request, Response } from 'express';
import { v7 as uuidv7 } from 'uuid';
import ExcelJS from 'exceljs';
import db from '../config/database';

/**
 * gerenteController.ts
 * Fechamento de boletas por PERÍODO (de — até). Só o Gerente fecha.
 * Após o fechamento, nenhuma boleta com data dentro do período pode ser editada.
 * Também gera a planilha oficial final (boletas + chamados de infra).
 */

interface SessUsuario { id: string; perfil: string; }

/**
 * Retorna true se a data informada cai dentro de algum período já fechado.
 * Cobre tanto fechamentos por período (data_inicio/data_fim) quanto por mês (legado).
 */
export function mesEstaFechado(data: string | null | undefined): boolean {
  if (!data) return false;
  const dia = String(data).slice(0, 10);
  const mes = String(data).slice(0, 7);
  const row = db.prepare(`
    SELECT 1 FROM fechamentos
    WHERE (data_inicio IS NOT NULL AND data_fim IS NOT NULL AND ? BETWEEN data_inicio AND data_fim)
       OR (data_inicio IS NULL AND mes = ?)
    LIMIT 1
  `).get(dia, mes);
  return !!row;
}

// GET /api/gerente/fechamentos — lista os períodos já fechados
export function listarFechamentos(_req: Request, res: Response) {
  const rows = db.prepare(`
    SELECT f.id, f.mes, f.data_inicio, f.data_fim, f.fechado_em, f.observacao, u.nome AS fechado_por_nome
    FROM fechamentos f
    LEFT JOIN usuarios u ON u.id = f.fechado_por
    ORDER BY COALESCE(f.data_inicio, f.mes) DESC
  `).all();
  return res.json(rows);
}

// POST /api/gerente/fechamento  { data_inicio: 'AAAA-MM-DD', data_fim: 'AAAA-MM-DD' }
export function fecharMes(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess || sess.perfil !== 'Gerente') {
    return res.status(403).json({ erro: 'Apenas o Gerente pode fechar o período.' });
  }

  const dataInicio = String(req.body?.data_inicio || '').trim();
  const dataFim = String(req.body?.data_fim || '').trim();
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(dataInicio) || !re.test(dataFim)) {
    return res.status(400).json({ erro: 'Informe data inicial e final (AAAA-MM-DD).' });
  }
  if (dataInicio > dataFim) {
    return res.status(400).json({ erro: 'A data inicial não pode ser maior que a final.' });
  }

  const chaveMes = `${dataInicio}..${dataFim}`; // chave sintética (coluna mes é NOT NULL)
  const jaExiste = db.prepare('SELECT 1 FROM fechamentos WHERE mes = ?').get(chaveMes);
  if (jaExiste) {
    return res.status(409).json({ erro: 'Esse período já foi fechado.' });
  }

  const qtdBoletas = (db.prepare(
    `SELECT COUNT(DISTINCT grupo_id) AS n FROM movimentacoes WHERE data BETWEEN ? AND ?`
  ).get(dataInicio, dataFim) as any).n;

  db.prepare(
    `INSERT INTO fechamentos (id, mes, data_inicio, data_fim, fechado_por, observacao)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(uuidv7(), chaveMes, dataInicio, dataFim, sess.id, req.body?.observacao || null);

  return res.status(201).json({
    mensagem: `Período de ${dataInicio} a ${dataFim} fechado. ${qtdBoletas} boleta(s) travada(s).`,
    data_inicio: dataInicio,
    data_fim: dataFim,
    boletas_travadas: qtdBoletas,
  });
}

// DELETE /api/gerente/fechamento/:id — reabre um período fechado
export function reabrirMes(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess || sess.perfil !== 'Gerente') {
    return res.status(403).json({ erro: 'Apenas o Gerente pode reabrir o período.' });
  }
  const id = String(req.params.mes); // mantém o nome do param por compat; agora é o id do fechamento
  const existe = db.prepare('SELECT 1 FROM fechamentos WHERE id = ? OR mes = ?').get(id, id);
  if (!existe) return res.status(404).json({ erro: 'Fechamento não encontrado.' });

  db.prepare('DELETE FROM fechamentos WHERE id = ? OR mes = ?').run(id, id);
  return res.json({ mensagem: 'Período reaberto para edição.' });
}

// GET /api/gerente/planilha-oficial?data_inicio=&data_fim=
// Planilha oficial final: aba Boletas + aba Chamados de Infra. Só Gerente.
export async function exportarPlanilhaOficial(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess || sess.perfil !== 'Gerente') {
    return res.status(403).send('Apenas o Gerente gera a planilha oficial.');
  }

  const di = typeof req.query.data_inicio === 'string' ? req.query.data_inicio : null;
  const df = typeof req.query.data_fim === 'string' ? req.query.data_fim : null;

  // --- Boletas ---
  const condB: string[] = [];
  const parB: any[] = [];
  if (di) { condB.push('m.data >= ?'); parB.push(di); }
  if (df) { condB.push('m.data <= ?'); parB.push(df); }
  const whereB = condB.length ? 'WHERE ' + condB.join(' AND ') : '';
  const boletas = db.prepare(`
    SELECT m.numero_boleta, m.data, m.tipo_operacao, m.categoria, m.quantidade,
           r.nome AS retiro_nome, ro.nome AS origem_nome, rd.nome AS destino_nome,
           m.causa_morte, m.observacoes, m.latitude, m.longitude,
           CASE WHEN m.aprovado_por_coordenador_id IS NOT NULL THEN 'Aprovada' ELSE 'Pendente' END AS situacao
    FROM movimentacoes m
    LEFT JOIN retiros r  ON r.id  = m.retiro_id
    LEFT JOIN retiros ro ON ro.id = m.retiro_origem_id
    LEFT JOIN retiros rd ON rd.id = m.retiro_destino_id
    ${whereB}
    ORDER BY m.data DESC, m.numero_boleta
  `).all(...parB) as any[];

  // --- Chamados de infra ---
  const condC: string[] = [];
  const parC: any[] = [];
  if (di) { condC.push('date(a.criado_em) >= ?'); parC.push(di); }
  if (df) { condC.push('date(a.criado_em) <= ?'); parC.push(df); }
  const whereC = condC.length ? 'WHERE ' + condC.join(' AND ') : '';
  const chamados = db.prepare(`
    SELECT a.tipo, a.descricao, a.status, a.local_referencia, a.criado_em, a.resolvido_em,
           r.nome AS retiro_nome, cap.nome AS capataz_nome, tec.nome AS tecnico_nome,
           a.latitude, a.longitude
    FROM alertas a
    LEFT JOIN retiros  r   ON r.id  = a.retiro_id
    LEFT JOIN usuarios cap ON cap.id = a.capataz_id
    LEFT JOIN usuarios tec ON tec.id = a.tecnico_id
    ${whereC}
    ORDER BY a.criado_em DESC
  `).all(...parC) as any[];

  const wb = new ExcelJS.Workbook();
  wb.creator = 'BRPec';
  wb.created = new Date();

  const VERDE = 'FF1A4D2E';
  function estilizarHeader(ws: ExcelJS.Worksheet, headers: string[], larguras: number[]) {
    const hr = ws.getRow(1);
    headers.forEach((h, i) => {
      const c = hr.getCell(i + 1);
      c.value = h;
      c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } };
      c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
    hr.height = 22;
    ws.columns = larguras.map((w) => ({ width: w }));
    ws.views = [{ state: 'frozen', ySplit: 1 }];
  }

  // Aba 1 — Boletas
  const wsB = wb.addWorksheet('Boletas');
  estilizarHeader(wsB,
    ['Nº Boleta', 'Data', 'Tipo', 'Categoria', 'Qtd', 'Retiro', 'Origem', 'Destino', 'Causa', 'Situação', 'GPS'],
    [16, 12, 18, 24, 8, 18, 16, 16, 16, 12, 22]);
  boletas.forEach((b) => {
    wsB.addRow([
      b.numero_boleta || '', b.data || '', b.tipo_operacao || '', b.categoria || '', Number(b.quantidade) || 0,
      b.retiro_nome || '', b.origem_nome || '', b.destino_nome || '', b.causa_morte || '', b.situacao || '',
      (b.latitude && b.longitude) ? `${b.latitude}, ${b.longitude}` : '',
    ]);
  });

  // Aba 2 — Chamados de infra
  const wsC = wb.addWorksheet('Chamados Infra');
  estilizarHeader(wsC,
    ['Tipo', 'Descrição', 'Status', 'Local', 'Retiro', 'Capataz', 'Técnico', 'Aberto em', 'Resolvido em', 'GPS'],
    [14, 36, 14, 24, 18, 18, 18, 18, 18, 22]);
  chamados.forEach((c) => {
    wsC.addRow([
      c.tipo || '', c.descricao || '', c.status || '', c.local_referencia || '',
      c.retiro_nome || '', c.capataz_nome || '', c.tecnico_nome || '',
      (c.criado_em || '').slice(0, 16).replace('T', ' '),
      (c.resolvido_em || '').slice(0, 16).replace('T', ' '),
      (c.latitude && c.longitude) ? `${c.latitude}, ${c.longitude}` : '',
    ]);
  });

  const periodo = (di && df) ? `${di}_a_${df}` : new Date().toISOString().slice(0, 10);
  const filename = `BRPec_oficial_${periodo}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
}
