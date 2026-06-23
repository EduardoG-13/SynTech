import db from '../config/database';

class HistoricoRepository {
  public obterRetirosDoCoordenador(coordenador_id: string): string[] {
    const rows = db.prepare('SELECT id FROM retiros WHERE coordenador_id = ?').all(coordenador_id) as { id: string }[];
    return rows.map((r) => r.id);
  }

  public listarBoletas(permitidos: string[] | null, perfil: string, sessId: string, filtros: any) {
    const params: any[] = [];
    const conds: string[] = [];

    if (permitidos !== null) {
      if (permitidos.length === 0) return [];
      const ph = permitidos.map(() => '?').join(',');
      conds.push(`(m.retiro_id IN (${ph}) OR m.retiro_origem_id IN (${ph}) OR m.retiro_destino_id IN (${ph}))`);
      params.push(...permitidos, ...permitidos, ...permitidos);
    }

    if (perfil === 'Capataz') {
      conds.push('m.capataz_id = ?');
      params.push(sessId);
    }

    if (filtros.retiro_id) {
      conds.push('(m.retiro_id = ? OR m.retiro_origem_id = ? OR m.retiro_destino_id = ?)');
      const v = String(filtros.retiro_id);
      params.push(v, v, v);
    }
    if (filtros.tipo) { conds.push('m.tipo_operacao = ?'); params.push(String(filtros.tipo)); }
    if (filtros.data_inicio) { conds.push('m.data >= ?'); params.push(String(filtros.data_inicio)); }
    if (filtros.data_fim) { conds.push('m.data <= ?'); params.push(String(filtros.data_fim)); }
    if (filtros.status === 'aprovada') conds.push('m.aprovado_por_coordenador_id IS NOT NULL');
    if (filtros.status === 'pendente') conds.push('m.aprovado_por_coordenador_id IS NULL');
    if (filtros.busca && String(filtros.busca).trim()) {
      const termo = `%${String(filtros.busca).trim().toLowerCase()}%`;
      conds.push(`(
        LOWER(COALESCE(m.numero_boleta, '')) LIKE ?
        OR LOWER(COALESCE(m.grupo_id, '')) LIKE ?
        OR LOWER(COALESCE(u.nome, '')) LIKE ?
        OR LOWER(COALESCE(r.nome, '')) LIKE ?
      )`);
      params.push(termo, termo, termo, termo);
    }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    return db.prepare(`
      SELECT m.*, r.nome AS retiro_nome, u.nome AS capataz_nome
      FROM movimentacoes m
      LEFT JOIN retiros r ON r.id = m.retiro_id
      LEFT JOIN usuarios u ON u.id = m.capataz_id
      ${where}
      ORDER BY m.criado_em DESC
      LIMIT 200
    `).all(...params) as any[];
  }

  public listarChamados(permitidos: string[] | null, perfil: string, sessRetiroId: string | null | undefined, sessCategoria: string | undefined, filtros: any) {
    const params: any[] = [];
    const conds: string[] = [];

    if (permitidos !== null && perfil === 'Coordenador') {
      if (permitidos.length === 0) return [];
      const ph = permitidos.map(() => '?').join(',');
      conds.push(`a.retiro_id IN (${ph})`);
      params.push(...permitidos);
    }
    if (perfil === 'Capataz' && sessRetiroId) {
      conds.push('a.retiro_id = ?');
      params.push(sessRetiroId);
    }
    if (perfil === 'Infraestrutura' && sessCategoria) {
      conds.push('LOWER(a.tipo) = LOWER(?)');
      params.push(sessCategoria);
    }

    if (filtros.retiro_id) { conds.push('a.retiro_id = ?'); params.push(String(filtros.retiro_id)); }
    if (filtros.status) { conds.push('a.status = ?'); params.push(String(filtros.status)); }
    if (filtros.tipo) { conds.push('LOWER(a.tipo) = LOWER(?)'); params.push(String(filtros.tipo)); }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    return db.prepare(`
      SELECT a.*, r.nome AS retiro_nome
      FROM alertas a
      LEFT JOIN retiros r ON r.id = a.retiro_id
      ${where}
      ORDER BY a.criado_em DESC
      LIMIT 200
    `).all(...params) as any[];
  }
}

export default new HistoricoRepository();
