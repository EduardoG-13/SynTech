import db from '../config/database';

class CoordenadorRepository {
  public obterRetirosDoCoordenador(coordenador_id: string): string[] {
    const rows = db.prepare(
      'SELECT id FROM retiros WHERE coordenador_id = ?'
    ).all(coordenador_id) as { id: string }[];
    return rows.map((r) => r.id);
  }

  public listarBoletasPendentes(retirosPermitidos: string[] | null) {
    let sql = `
      SELECT m.*, u.nome AS capataz_nome, r.nome AS retiro_nome
      FROM movimentacoes m
      LEFT JOIN usuarios u ON u.id = m.capataz_id
      LEFT JOIN retiros r ON r.id = m.retiro_id
      WHERE m.aprovado_por_coordenador_id IS NULL
    `;
    const params: any[] = [];

    if (retirosPermitidos !== null) {
      if (retirosPermitidos.length === 0) return [];
      const ph = retirosPermitidos.map(() => '?').join(',');
      sql += ` AND (m.retiro_id IN (${ph})
                OR m.retiro_origem_id IN (${ph})
                OR m.retiro_destino_id IN (${ph}))`;
      params.push(...retirosPermitidos, ...retirosPermitidos, ...retirosPermitidos);
    }

    sql += ' ORDER BY m.criado_em DESC';
    return db.prepare(sql).all(...params) as any[];
  }

  public obterBoletaParaAprovacao(idOuGrupo: string) {
    return db.prepare(
      `SELECT id, retiro_id, retiro_origem_id, retiro_destino_id, grupo_id
       FROM movimentacoes WHERE id = ? OR grupo_id = ?`
    ).all(idOuGrupo, idOuGrupo) as any[];
  }

  public aprovarMovimentacoes(ids: string[], coordenador_id: string) {
    const stmt = db.prepare(`
      UPDATE movimentacoes
      SET aprovado_por_coordenador_id = ?, aprovado_em = datetime('now'), validado = 1
      WHERE id = ?
    `);
    for (const id of ids) {
      stmt.run(coordenador_id, id);
    }
  }

  public buscarMovimentacoesParaExport(retirosPermitidos: string[] | null, ids?: string, retiro_id?: string, data_inicio?: string, data_fim?: string, somente_aprovadas?: string, tiposSelecionados?: string[]) {
    const conds: string[] = [];
    const params: any[] = [];

    if (retirosPermitidos !== null) {
      if (retirosPermitidos.length === 0) return [];
      const ph = retirosPermitidos.map(() => '?').join(',');
      conds.push(`(m.retiro_id IN (${ph}) OR m.retiro_origem_id IN (${ph}) OR m.retiro_destino_id IN (${ph}))`);
      params.push(...retirosPermitidos, ...retirosPermitidos, ...retirosPermitidos);
    }

    if (ids) {
      const idList = ids.split(',').filter(Boolean);
      if (idList.length === 0) return [];
      const ph = idList.map(() => '?').join(',');
      conds.push(`(m.id IN (${ph}) OR m.grupo_id IN (${ph}))`);
      params.push(...idList, ...idList);
    }

    if (retiro_id) {
      conds.push('(m.retiro_id = ? OR m.retiro_origem_id = ? OR m.retiro_destino_id = ?)');
      params.push(String(retiro_id), String(retiro_id), String(retiro_id));
    }
    if (data_inicio) { conds.push('m.data >= ?'); params.push(String(data_inicio)); }
    if (data_fim) { conds.push('m.data <= ?'); params.push(String(data_fim)); }
    if (somente_aprovadas === '1') conds.push('m.aprovado_por_coordenador_id IS NOT NULL');

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

  public obterMovimentacoesCompletas(idOuGrupo: string) {
    return db.prepare(`
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
  }
}

export default new CoordenadorRepository();
