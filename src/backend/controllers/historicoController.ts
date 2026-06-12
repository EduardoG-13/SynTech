import { Request, Response } from 'express';
import db from '../config/database';

/**
 * historicoController.ts
 * Histórico unificado de boletas + chamados, filtrado por perfil:
 * - Gerente: tudo
 * - Coordenador: dos retiros que gerencia
 * - Capataz: só dele (boletas)
 * - Infraestrutura: só chamados (filtrados pela categoria)
 */

interface SessUsuario { id: string; perfil: string; retiro_id?: string | null; categoria?: string; }

function retirosVisiveis(sess: SessUsuario): string[] | null {
  if (sess.perfil === 'Gerente') return null;
  if (sess.perfil === 'Coordenador') {
    const rows = db.prepare('SELECT id FROM retiros WHERE coordenador_id = ?').all(sess.id) as { id: string }[];
    return rows.map((r) => r.id);
  }
  if (sess.perfil === 'Capataz' && sess.retiro_id) return [sess.retiro_id];
  if (sess.perfil === 'Infraestrutura') return null; // Infra vê chamados de todos os retiros (filtra por categoria)
  return [];
}

// GET /api/historico/boletas
export function listarBoletas(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  // Infra não vê boletas
  if (sess.perfil === 'Infraestrutura') return res.json([]);

  const permitidos = retirosVisiveis(sess);
  const params: any[] = [];
  const conds: string[] = [];

  if (permitidos !== null) {
    if (permitidos.length === 0) return res.json([]);
    const ph = permitidos.map(() => '?').join(',');
    conds.push(`(m.retiro_id IN (${ph}) OR m.retiro_origem_id IN (${ph}) OR m.retiro_destino_id IN (${ph}))`);
    params.push(...permitidos, ...permitidos, ...permitidos);
  }

  // Capataz vê só dele
  if (sess.perfil === 'Capataz') {
    conds.push('m.capataz_id = ?');
    params.push(sess.id);
  }

  // Filtros adicionais (query string)
  // Retiro: cobre transferências (origem/destino) também
  if (req.query.retiro_id) {
    conds.push('(m.retiro_id = ? OR m.retiro_origem_id = ? OR m.retiro_destino_id = ?)');
    const v = String(req.query.retiro_id);
    params.push(v, v, v);
  }
  if (req.query.tipo)      { conds.push('m.tipo_operacao = ?'); params.push(String(req.query.tipo)); }
  if (req.query.data_inicio) { conds.push('m.data >= ?'); params.push(String(req.query.data_inicio)); }
  if (req.query.data_fim)    { conds.push('m.data <= ?'); params.push(String(req.query.data_fim)); }
  if (req.query.status === 'aprovada')  conds.push('m.aprovado_por_coordenador_id IS NOT NULL');
  if (req.query.status === 'pendente')  conds.push('m.aprovado_por_coordenador_id IS NULL');

  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  const rows = db.prepare(`
    SELECT m.*, r.nome AS retiro_nome, u.nome AS capataz_nome
    FROM movimentacoes m
    LEFT JOIN retiros r ON r.id = m.retiro_id
    LEFT JOIN usuarios u ON u.id = m.capataz_id
    ${where}
    ORDER BY m.criado_em DESC
    LIMIT 200
  `).all(...params) as any[];

  // Agrupa por grupo_id
  const grupos: Record<string, any> = {};
  for (const r of rows) {
    const key = r.grupo_id || r.id;
    if (!grupos[key]) {
      grupos[key] = {
        id: key,
        operacao: r.tipo_operacao,
        data: r.data,
        retiro_nome: r.retiro_nome,
        capataz_nome: r.capataz_nome,
        aprovada: !!r.aprovado_por_coordenador_id,
        criadoEm: r.criado_em,
        animais: [],
      };
    }
    grupos[key].animais.push({ categoria: r.categoria, quantidade: r.quantidade });
  }
  return res.json(Object.values(grupos));
}

// GET /api/historico/chamados
export function listarChamados(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const params: any[] = [];
  const conds: string[] = [];

  // Filtro por retiro permitido
  const permitidos = retirosVisiveis(sess);
  if (permitidos !== null && sess.perfil === 'Coordenador') {
    if (permitidos.length === 0) return res.json([]);
    const ph = permitidos.map(() => '?').join(',');
    conds.push(`a.retiro_id IN (${ph})`);
    params.push(...permitidos);
  }
  if (sess.perfil === 'Capataz' && sess.retiro_id) {
    conds.push('a.retiro_id = ?');
    params.push(sess.retiro_id);
  }
  // Infra filtra pela categoria dela
  if (sess.perfil === 'Infraestrutura' && sess.categoria) {
    conds.push('LOWER(a.tipo) = LOWER(?)');
    params.push(sess.categoria);
  }

  // Filtros adicionais
  if (req.query.retiro_id) { conds.push('a.retiro_id = ?'); params.push(String(req.query.retiro_id)); }
  if (req.query.status)    { conds.push('a.status = ?'); params.push(String(req.query.status)); }
  if (req.query.tipo)      { conds.push('LOWER(a.tipo) = LOWER(?)'); params.push(String(req.query.tipo)); }

  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  const rows = db.prepare(`
    SELECT a.*, r.nome AS retiro_nome
    FROM alertas a
    LEFT JOIN retiros r ON r.id = a.retiro_id
    ${where}
    ORDER BY a.criado_em DESC
    LIMIT 200
  `).all(...params) as any[];
  return res.json(rows);
}
