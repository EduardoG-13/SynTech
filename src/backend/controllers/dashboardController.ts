import { Request, Response } from 'express';
import db from '../config/database';

/**
 * dashboardController.ts
 * Dashboard de Gerente e Coordenador.
 * - Gerente: vê todos os retiros.
 * - Coordenador: vê APENAS os retiros que gerencia (retiros.coordenador_id = usuario.id).
 */

interface SessUsuario { id: string; perfil: string; }

/** Retorna IDs de retiros visíveis ao usuário logado. null = sem filtro (Gerente). */
function retirosVisiveis(sess: SessUsuario): string[] | null {
  if (sess.perfil === 'Gerente') return null;
  const rows = db.prepare(
    'SELECT id FROM retiros WHERE coordenador_id = ?'
  ).all(sess.id) as { id: string }[];
  return rows.map((r) => r.id);
}

// GET /api/dashboard/resumo
export function obterResumo(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  // Filtro por PERÍODO (de — até). Compatível com o ?data= antigo (vira início=fim).
  const q = req.query as Record<string, unknown>;
  const dataUnica  = typeof q.data === 'string' && q.data ? q.data : null;
  const dataInicio = (typeof q.data_inicio === 'string' && q.data_inicio ? q.data_inicio : null) || dataUnica;
  const dataFim    = (typeof q.data_fim === 'string' && q.data_fim ? q.data_fim : null) || dataUnica;

  const permitidos = retirosVisiveis(sess);
  const filtroRetirosSql = permitidos === null
    ? ''
    : (permitidos.length === 0 ? 'WHERE 1=0' : `WHERE id IN (${permitidos.map(() => '?').join(',')})`);
  const filtroRetirosParams = permitidos === null ? [] : permitidos;

  // Chamados em aberto por retiro — TODOS os retiros visíveis (inclusive os com 0,
  // pra dar visão completa da fazenda). LEFT JOIN garante retiro sem chamado aparecendo.
  const filtroAlertaPorRetiro = permitidos === null
    ? ''
    : (permitidos.length === 0 ? 'WHERE 1=0' : `WHERE r.id IN (${permitidos.map(() => '?').join(',')})`);
  const dateJoinConds: string[] = [];
  const dateJoinParams: any[] = [];
  if (dataInicio) { dateJoinConds.push('date(a.criado_em) >= ?'); dateJoinParams.push(dataInicio); }
  if (dataFim)    { dateJoinConds.push('date(a.criado_em) <= ?'); dateJoinParams.push(dataFim); }
  const dateJoinAlerta = dateJoinConds.length ? ' AND ' + dateJoinConds.join(' AND ') : '';
  const chamadosPorRetiro = db.prepare(`
    SELECT r.nome AS retiro, COUNT(a.id) AS total
    FROM retiros r
    LEFT JOIN alertas a ON a.retiro_id = r.id AND a.status IN ('ABERTO', 'EM_ANDAMENTO')${dateJoinAlerta}
    ${filtroAlertaPorRetiro}
    GROUP BY r.id, r.nome
    ORDER BY total DESC, r.nome
  `).all(...dateJoinParams, ...filtroRetirosParams) as any[];

  // Boletas (movimentações) — filtra por retiros visíveis incluindo origem/destino em transferências
  const condMovParams: any[] = [];
  let condMov = '';
  if (permitidos !== null) {
    if (permitidos.length === 0) {
      condMov = 'WHERE 1=0';
    } else {
      const ph = permitidos.map(() => '?').join(',');
      condMov = `WHERE (retiro_id IN (${ph}) OR retiro_origem_id IN (${ph}) OR retiro_destino_id IN (${ph}))`;
      condMovParams.push(...permitidos, ...permitidos, ...permitidos);
    }
  }
  if (dataInicio) {
    condMov += condMov ? ` AND data >= ?` : ` WHERE data >= ?`;
    condMovParams.push(dataInicio);
  }
  if (dataFim) {
    condMov += condMov ? ` AND data <= ?` : ` WHERE data <= ?`;
    condMovParams.push(dataFim);
  }
  const totaisBoletas = db.prepare(`
    SELECT
      SUM(CASE WHEN aprovado_por_coordenador_id IS NULL THEN 1 ELSE 0 END) AS pendentes,
      SUM(CASE WHEN aprovado_por_coordenador_id IS NOT NULL THEN 1 ELSE 0 END) AS aprovadas,
      COUNT(*) AS total
    FROM movimentacoes
    ${condMov}
  `).get(...condMovParams) as any;

  // Chamados de infra por status (filtra por retiros visíveis)
  let condAlerta = '';
  const condAlertaParams: any[] = [];
  if (permitidos !== null) {
    if (permitidos.length === 0) {
      condAlerta = 'WHERE 1=0';
    } else {
      const ph = permitidos.map(() => '?').join(',');
      condAlerta = `WHERE retiro_id IN (${ph})`;
      condAlertaParams.push(...permitidos);
    }
  }
  if (dataInicio) {
    condAlerta += condAlerta ? ` AND date(criado_em) >= ?` : ` WHERE date(criado_em) >= ?`;
    condAlertaParams.push(dataInicio);
  }
  if (dataFim) {
    condAlerta += condAlerta ? ` AND date(criado_em) <= ?` : ` WHERE date(criado_em) <= ?`;
    condAlertaParams.push(dataFim);
  }
  const chamadosPorStatus = db.prepare(`
    SELECT
      SUM(CASE WHEN status = 'ABERTO' THEN 1 ELSE 0 END) AS abertos,
      SUM(CASE WHEN status = 'EM_ANDAMENTO' THEN 1 ELSE 0 END) AS andamento,
      SUM(CASE WHEN status = 'RESOLVIDO' THEN 1 ELSE 0 END) AS resolvidos
    FROM alertas
    ${condAlerta}
  `).get(...condAlertaParams) as any;

  const totalRetiros = (db.prepare(`SELECT COUNT(*) AS n FROM retiros ${filtroRetirosSql}`).get(...filtroRetirosParams) as any).n;

  // Capatazes visíveis: vinculados aos retiros do coord
  let totalCapatazes;
  if (permitidos === null) {
    totalCapatazes = (db.prepare(`SELECT COUNT(*) AS n FROM usuarios WHERE perfil='Capataz'`).get() as any).n;
  } else if (permitidos.length === 0) {
    totalCapatazes = 0;
  } else {
    const ph = permitidos.map(() => '?').join(',');
    totalCapatazes = (db.prepare(
      `SELECT COUNT(*) AS n FROM usuarios WHERE perfil='Capataz' AND retiro_id IN (${ph})`
    ).get(...permitidos) as any).n;
  }

  // Boletas por tipo de operação (gráfico de barras)
  const boletasPorTipo = db.prepare(`
    SELECT tipo_operacao AS tipo, COUNT(DISTINCT grupo_id) AS total
    FROM movimentacoes
    ${condMov}
    GROUP BY tipo_operacao
    ORDER BY total DESC
  `).all(...condMovParams) as any[];

  // Infra/Manutenção como uma "área" extra no mesmo gráfico: quantos chamados de
  // infra foram abertos no escopo. Mostra de bate-pronto se houve muita manutenção.
  const totalChamadosInfra = (db.prepare(`
    SELECT COUNT(*) AS n FROM alertas ${condAlerta}
  `).get(...condAlertaParams) as any).n;
  boletasPorTipo.push({ tipo: 'infra', total: totalChamadosInfra });

  // Evolução mensal de boletas — últimos 6 meses (gráfico de linha)
  const boletasPorMes = db.prepare(`
    SELECT substr(data, 1, 7) AS mes, COUNT(DISTINCT grupo_id) AS total
    FROM movimentacoes
    ${condMov}
    GROUP BY substr(data, 1, 7)
    ORDER BY mes DESC
    LIMIT 6
  `).all(...condMovParams) as any[];
  boletasPorMes.reverse(); // ordem cronológica pro gráfico

  // Total de cabeças movimentadas (KPI)
  const totalCabecas = (db.prepare(`
    SELECT COALESCE(SUM(quantidade), 0) AS n FROM movimentacoes ${condMov}
  `).get(...condMovParams) as any).n;

  return res.json({
    chamadosPorRetiro,
    boletas: totaisBoletas,
    boletasPorTipo,
    boletasPorMes,
    chamados: chamadosPorStatus,
    totais: { retiros: totalRetiros, capatazes: totalCapatazes, cabecas: totalCabecas },
    escopo: sess.perfil === 'Gerente' ? 'todos' : 'meus-retiros',
  });
}

// GET /api/dashboard/retiros
export function listarRetirosDashboard(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const permitidos = retirosVisiveis(sess);
  let whereSql = '';
  const params: any[] = [];
  if (permitidos !== null) {
    if (permitidos.length === 0) return res.json([]);
    whereSql = `WHERE r.id IN (${permitidos.map(() => '?').join(',')})`;
    params.push(...permitidos);
  }

  const rows = db.prepare(`
    SELECT r.id, r.nome, r.numero,
           c.nome AS coordenador_nome,
           cap.nome AS capataz_nome,
           (SELECT COUNT(*) FROM movimentacoes m WHERE m.retiro_id = r.id) AS total_boletas,
           (SELECT COUNT(*) FROM alertas a WHERE a.retiro_id = r.id AND a.status IN ('ABERTO', 'EM_ANDAMENTO')) AS chamados_abertos
    FROM retiros r
    LEFT JOIN usuarios c ON c.id = r.coordenador_id
    LEFT JOIN usuarios cap ON cap.id = r.capataz_id
    ${whereSql}
    ORDER BY r.nome
  `).all(...params);
  return res.json(rows);
}
