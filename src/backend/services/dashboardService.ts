import db from '../config/database';

interface SessUsuario { id: string; perfil: string; }

export class DashboardService {
  private retirosVisiveis(sess: SessUsuario): string[] | null {
    if (sess.perfil === 'Gerente') return null;
    const rows = db.prepare(
      'SELECT id FROM retiros WHERE coordenador_id = ?'
    ).all(sess.id) as { id: string }[];
    return rows.map((r) => r.id);
  }

  public obterResumo(sess: SessUsuario, filtroData: string | null) {
    const permitidos = this.retirosVisiveis(sess);
    const filtroRetirosSql = permitidos === null
      ? ''
      : (permitidos.length === 0 ? 'WHERE 1=0' : `WHERE id IN (${permitidos.map(() => '?').join(',')})`);
    const filtroRetirosParams = permitidos === null ? [] : permitidos;

    // Boletas por retiro (top 8)
    const filtroAlertaPorRetiro = permitidos === null
      ? ''
      : (permitidos.length === 0 ? 'WHERE 1=0' : `WHERE r.id IN (${permitidos.map(() => '?').join(',')})`);
    const dateJoinAlerta = filtroData ? ` AND date(a.criado_em) = ?` : '';
    const dateJoinParams = filtroData ? [filtroData] : [];
    const chamadosPorRetiro = db.prepare(`
      SELECT r.nome AS retiro, COUNT(a.id) AS total
      FROM retiros r
      LEFT JOIN alertas a ON a.retiro_id = r.id AND a.status IN ('ABERTO', 'EM_ANDAMENTO')${dateJoinAlerta}
      ${filtroAlertaPorRetiro}
      GROUP BY r.id, r.nome
      ORDER BY total DESC
      LIMIT 8
    `).all(...dateJoinParams, ...filtroRetirosParams) as any[];

    // Boletas (movimentações)
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
    const totaisBoletas = db.prepare(`
      SELECT
        SUM(CASE WHEN aprovado_por_coordenador_id IS NULL THEN 1 ELSE 0 END) AS pendentes,
        SUM(CASE WHEN aprovado_por_coordenador_id IS NOT NULL THEN 1 ELSE 0 END) AS aprovadas,
        COUNT(*) AS total
      FROM movimentacoes
      ${condMov}
    `).get(...condMovParams) as any;

    // Chamados de infra por status
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
    const chamadosPorStatus = db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'ABERTO' THEN 1 ELSE 0 END) AS abertos,
        SUM(CASE WHEN status = 'EM_ANDAMENTO' THEN 1 ELSE 0 END) AS andamento,
        SUM(CASE WHEN status = 'RESOLVIDO' THEN 1 ELSE 0 END) AS resolvidos
      FROM alertas
      ${condAlerta}
    `).get(...condAlertaParams) as any;

    const totalRetiros = (db.prepare(`SELECT COUNT(*) AS n FROM retiros ${filtroRetirosSql}`).get(...filtroRetirosParams) as any).n;

    // Capatazes visíveis
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

    return {
      chamadosPorRetiro,
      boletas: totaisBoletas,
      chamados: chamadosPorStatus,
      totais: { retiros: totalRetiros, capatazes: totalCapatazes },
      escopo: sess.perfil === 'Gerente' ? 'todos' : 'meus-retiros',
    };
  }

  public listarRetirosDashboard(sess: SessUsuario) {
    const permitidos = this.retirosVisiveis(sess);
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

export default new DashboardService();
