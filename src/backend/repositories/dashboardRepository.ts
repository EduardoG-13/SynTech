import db from '../config/database';

class DashboardRepository {
  public obterRetirosVisiveis(coordenador_id: string): string[] {
    const rows = db.prepare('SELECT id FROM retiros WHERE coordenador_id = ?').all(coordenador_id) as { id: string }[];
    return rows.map((r) => r.id);
  }

  public obterChamadosPorRetiro(permitidos: string[] | null, filtroData: string | null) {
    const filtroAlertaPorRetiro = permitidos === null
      ? ''
      : (permitidos.length === 0 ? 'WHERE 1=0' : `WHERE r.id IN (${permitidos.map(() => '?').join(',')})`);
    const dateJoinAlerta = filtroData ? ` AND date(a.criado_em) = ?` : '';
    const dateJoinParams = filtroData ? [filtroData] : [];
    const filtroRetirosParams = permitidos === null ? [] : permitidos;

    return db.prepare(`
      SELECT r.nome AS retiro, COUNT(a.id) AS total
      FROM retiros r
      LEFT JOIN alertas a ON a.retiro_id = r.id AND a.status IN ('ABERTO', 'EM_ANDAMENTO')${dateJoinAlerta}
      ${filtroAlertaPorRetiro}
      GROUP BY r.id, r.nome
      ORDER BY total DESC
      LIMIT 8
    `).all(...dateJoinParams, ...filtroRetirosParams) as any[];
  }

  public obterTotaisBoletas(permitidos: string[] | null, filtroData: string | null) {
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
    if (filtroData) {
      condMov += condMov ? ` AND data = ?` : ` WHERE data = ?`;
      condMovParams.push(filtroData);
    }
    return db.prepare(`
      SELECT
        SUM(CASE WHEN aprovado_por_coordenador_id IS NULL THEN 1 ELSE 0 END) AS pendentes,
        SUM(CASE WHEN aprovado_por_coordenador_id IS NOT NULL THEN 1 ELSE 0 END) AS aprovadas,
        COUNT(*) AS total
      FROM movimentacoes
      ${condMov}
    `).get(...condMovParams) as any;
  }

  public obterChamadosPorStatus(permitidos: string[] | null, filtroData: string | null) {
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
    if (filtroData) {
      condAlerta += condAlerta ? ` AND date(criado_em) = ?` : ` WHERE date(criado_em) = ?`;
      condAlertaParams.push(filtroData);
    }
    return db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'ABERTO' THEN 1 ELSE 0 END) AS abertos,
        SUM(CASE WHEN status = 'EM_ANDAMENTO' THEN 1 ELSE 0 END) AS andamento,
        SUM(CASE WHEN status = 'RESOLVIDO' THEN 1 ELSE 0 END) AS resolvidos
      FROM alertas
      ${condAlerta}
    `).get(...condAlertaParams) as any;
  }

  public obterTotalRetiros(permitidos: string[] | null) {
    const filtroRetirosSql = permitidos === null
      ? ''
      : (permitidos.length === 0 ? 'WHERE 1=0' : `WHERE id IN (${permitidos.map(() => '?').join(',')})`);
    const filtroRetirosParams = permitidos === null ? [] : permitidos;
    return (db.prepare(`SELECT COUNT(*) AS n FROM retiros ${filtroRetirosSql}`).get(...filtroRetirosParams) as any).n;
  }

  public obterTotalCapatazes(permitidos: string[] | null) {
    if (permitidos === null) {
      return (db.prepare(`SELECT COUNT(*) AS n FROM usuarios WHERE perfil='Capataz'`).get() as any).n;
    } else if (permitidos.length === 0) {
      return 0;
    } else {
      const ph = permitidos.map(() => '?').join(',');
      return (db.prepare(
        `SELECT COUNT(*) AS n FROM usuarios WHERE perfil='Capataz' AND retiro_id IN (${ph})`
      ).get(...permitidos) as any).n;
    }
  }

  public listarRetirosDashboard(permitidos: string[] | null) {
    let whereSql = '';
    const params: any[] = [];
    if (permitidos !== null) {
      if (permitidos.length === 0) return [];
      whereSql = `WHERE r.id IN (${permitidos.map(() => '?').join(',')})`;
      params.push(...permitidos);
    }

    return db.prepare(`
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
  }
}

export default new DashboardRepository();
