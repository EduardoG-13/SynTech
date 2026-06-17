import db from '../config/database';

interface SessUsuario {
  id: string;
  perfil: string;
  retiro_id?: string | null;
  categoria?: string;
}

export class HistoricoService {
  private retirosVisiveis(sess: SessUsuario): string[] | null {
    if (sess.perfil === 'Gerente') return null;
    if (sess.perfil === 'Coordenador') {
      const rows = db.prepare('SELECT id FROM retiros WHERE coordenador_id = ?').all(sess.id) as { id: string }[];
      return rows.map((r) => r.id);
    }
    if (sess.perfil === 'Capataz' && sess.retiro_id) return [sess.retiro_id];
    if (sess.perfil === 'Infraestrutura') return null;
    return [];
  }

  public listarBoletas(sess: SessUsuario, filtros: any) {
    if (sess.perfil === 'Infraestrutura') return [];

    const permitidos = this.retirosVisiveis(sess);
    const params: any[] = [];
    const conds: string[] = [];

    if (permitidos !== null) {
      if (permitidos.length === 0) return [];
      const ph = permitidos.map(() => '?').join(',');
      conds.push(`(m.retiro_id IN (${ph}) OR m.retiro_origem_id IN (${ph}) OR m.retiro_destino_id IN (${ph}))`);
      params.push(...permitidos, ...permitidos, ...permitidos);
    }

    if (sess.perfil === 'Capataz') {
      conds.push('m.capataz_id = ?');
      params.push(sess.id);
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
    return Object.values(grupos);
  }

  public listarChamados(sess: SessUsuario, filtros: any) {
    const params: any[] = [];
    const conds: string[] = [];

    const permitidos = this.retirosVisiveis(sess);
    if (permitidos !== null && sess.perfil === 'Coordenador') {
      if (permitidos.length === 0) return [];
      const ph = permitidos.map(() => '?').join(',');
      conds.push(`a.retiro_id IN (${ph})`);
      params.push(...permitidos);
    }
    if (sess.perfil === 'Capataz' && sess.retiro_id) {
      conds.push('a.retiro_id = ?');
      params.push(sess.retiro_id);
    }
    if (sess.perfil === 'Infraestrutura' && sess.categoria) {
      conds.push('LOWER(a.tipo) = LOWER(?)');
      params.push(sess.categoria);
    }

    if (filtros.retiro_id) { conds.push('a.retiro_id = ?'); params.push(String(filtros.retiro_id)); }
    if (filtros.status) { conds.push('a.status = ?'); params.push(String(filtros.status)); }
    if (filtros.tipo) { conds.push('LOWER(a.tipo) = LOWER(?)'); params.push(String(filtros.tipo)); }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const rows = db.prepare(`
      SELECT a.*, r.nome AS retiro_nome
      FROM alertas a
      LEFT JOIN retiros r ON r.id = a.retiro_id
      ${where}
      ORDER BY a.criado_em DESC
      LIMIT 200
    `).all(...params) as any[];
    
    return rows;
  }
}

export default new HistoricoService();
