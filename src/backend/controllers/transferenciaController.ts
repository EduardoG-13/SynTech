import { Request, Response } from 'express';
import db from '../config/database';

interface SessUsuario { id: string; perfil: string; retiro_id?: string | null; }

/**
 * GET /api/transferencias/pendentes
 * Transferências de outros retiros destinadas ao retiro do capataz logado
 * que ainda não foram respondidas.
 */
export function listarPendentes(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const retiroId = sess.retiro_id;
  if (!retiroId) return res.json([]);

  const rows = db.prepare(`
    SELECT
      m.grupo_id,
      m.numero_boleta,
      m.data,
      m.retiro_origem_id,
      m.retiro_destino_id,
      m.tipo_transporte,
      m.motorista,
      m.placa,
      m.raca,
      m.observacoes,
      m.capataz_id,
      m.criado_em,
      ro.nome AS retiro_origem_nome,
      rd.nome AS retiro_destino_nome,
      uc.nome AS capataz_nome,
      SUM(m.quantidade) AS total_cabecas,
      GROUP_CONCAT(m.categoria || ':' || m.quantidade, '; ') AS categorias_resumo
    FROM movimentacoes m
    LEFT JOIN retiros ro ON ro.id = m.retiro_origem_id
    LEFT JOIN retiros rd ON rd.id = m.retiro_destino_id
    LEFT JOIN usuarios uc ON uc.id = m.capataz_id
    WHERE m.tipo_operacao = 'transferencia'
      AND m.retiro_destino_id = ?
      AND m.retiro_origem_id != ?
      AND m.transferencia_confirmada = 0
      AND (m.transferencia_par_grupo_id IS NULL OR m.transferencia_par_grupo_id = '')
    GROUP BY m.grupo_id
    ORDER BY m.data DESC
  `).all(retiroId, retiroId) as any[];

  return res.json(rows);
}

/**
 * GET /api/transferencias/:grupo_id/detalhes
 * Retorna as categorias e quantidades da transferência de origem.
 */
export function detalhesTransferencia(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const grupoId = String(req.params.grupo_id);

  const rows = db.prepare(`
    SELECT
      m.grupo_id, m.numero_boleta, m.data,
      m.retiro_origem_id, m.retiro_destino_id,
      m.tipo_transporte, m.motorista, m.placa, m.raca,
      m.observacoes, m.categoria, m.quantidade,
      ro.nome AS retiro_origem_nome,
      rd.nome AS retiro_destino_nome,
      uc.nome AS capataz_nome
    FROM movimentacoes m
    LEFT JOIN retiros ro ON ro.id = m.retiro_origem_id
    LEFT JOIN retiros rd ON rd.id = m.retiro_destino_id
    LEFT JOIN usuarios uc ON uc.id = m.capataz_id
    WHERE m.grupo_id = ? AND m.tipo_operacao = 'transferencia'
  `).all(grupoId) as any[];

  if (rows.length === 0) return res.status(404).json({ erro: 'Transferência não encontrada.' });

  const first = rows[0];
  return res.json({
    grupo_id: first.grupo_id,
    numero_boleta: first.numero_boleta,
    data: first.data,
    retiro_origem_id: first.retiro_origem_id,
    retiro_destino_id: first.retiro_destino_id,
    retiro_origem_nome: first.retiro_origem_nome,
    retiro_destino_nome: first.retiro_destino_nome,
    capataz_nome: first.capataz_nome,
    tipo_transporte: first.tipo_transporte,
    motorista: first.motorista,
    placa: first.placa,
    raca: first.raca,
    observacoes: first.observacoes,
    categorias: rows.map(r => ({ categoria: r.categoria, quantidade: r.quantidade }))
  });
}

/**
 * Vincula a boleta de origem e a boleta de destino de uma transferência.
 */
export function vincularTransferenciaBilateral(grupoIdOrigem: string, grupoIdDestino: string): { conflito: boolean } {
  const origemRows = db.prepare(
    `SELECT categoria, quantidade FROM movimentacoes WHERE grupo_id = ? AND tipo_operacao = 'transferencia' ORDER BY categoria`
  ).all(grupoIdOrigem) as { categoria: string; quantidade: number }[];

  const destinoRows = db.prepare(
    `SELECT categoria, quantidade FROM movimentacoes WHERE grupo_id = ? AND tipo_operacao = 'transferencia' ORDER BY categoria`
  ).all(grupoIdDestino) as { categoria: string; quantidade: number }[];

  const origemMap: Record<string, number> = {};
  for (const r of origemRows) origemMap[r.categoria] = (origemMap[r.categoria] || 0) + r.quantidade;

  const destinoMap: Record<string, number> = {};
  for (const r of destinoRows) destinoMap[r.categoria] = (destinoMap[r.categoria] || 0) + r.quantidade;

  const allCats = new Set([...Object.keys(origemMap), ...Object.keys(destinoMap)]);
  let conflito = false;
  for (const cat of allCats) {
    if ((origemMap[cat] || 0) !== (destinoMap[cat] || 0)) {
      conflito = true;
      break;
    }
  }

  db.prepare(
    `UPDATE movimentacoes SET transferencia_par_grupo_id = ?, transferencia_confirmada = 1 WHERE grupo_id = ?`
  ).run(grupoIdDestino, grupoIdOrigem);

  db.prepare(
    `UPDATE movimentacoes SET transferencia_par_grupo_id = ? WHERE grupo_id = ?`
  ).run(grupoIdOrigem, grupoIdDestino);

  if (conflito) {
    db.prepare(
      `UPDATE movimentacoes SET transferencia_conflito = 1 WHERE grupo_id IN (?, ?)`
    ).run(grupoIdOrigem, grupoIdDestino);
  }

  return { conflito };
}

export default { listarPendentes, detalhesTransferencia, vincularTransferenciaBilateral };
