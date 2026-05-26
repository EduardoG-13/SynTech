import db from '../config/database';

class PainelRepository {
  /**
   * Retorna contagem de tarefas agrupadas por status para um gerente.
   * Filtra por gerente_id para garantir que apenas tarefas criadas pelo gerente sejam exibidas.
   */
  obterMetricasTarefas(gerente_id: string) {
    const stmt = db.prepare(`
      SELECT
        status,
        COUNT(*) AS total
      FROM tarefas
      WHERE gerente_id = ?
      GROUP BY status
    `);
    return stmt.all(gerente_id);
  }

  /**
   * Retorna contagem de tarefas agrupadas por retiro e status.
   */
  obterTarefasPorRetiro(gerente_id: string) {
    const stmt = db.prepare(`
      SELECT
        r.id AS retiro_id,
        r.nome AS retiro_nome,
        t.status,
        COUNT(*) AS total
      FROM tarefas t
      JOIN retiros r ON r.id = t.retiro_id
      WHERE t.gerente_id = ?
      GROUP BY r.id, r.nome, t.status
      ORDER BY r.nome, t.status
    `);
    return stmt.all(gerente_id);
  }

  /**
   * Retorna alertas com status 'ABERTO', ordenados do mais recente ao mais antigo.
   */
  obterAlertasAbertos() {
    const stmt = db.prepare(`
      SELECT
        a.id,
        a.tipo,
        a.descricao,
        a.status,
        a.capataz_id,
        u.nome AS capataz_nome,
        a.retiro_id,
        r.nome AS retiro_nome,
        a.latitude,
        a.longitude,
        a.criado_em
      FROM alertas a
      LEFT JOIN usuarios u ON u.id = a.capataz_id
      LEFT JOIN retiros r ON r.id = a.retiro_id
      WHERE a.status = 'ABERTO'
      ORDER BY a.criado_em DESC
    `);
    return stmt.all();
  }

  /**
   * Retorna total de tarefas concluídas hoje.
   */
  obterConcluidasHoje(gerente_id: string) {
    const stmt = db.prepare(`
      SELECT COUNT(*) AS total
      FROM tarefas
      WHERE gerente_id = ?
        AND status = 'CONCLUIDA'
        AND date(concluida_em) = date('now')
    `);
    return stmt.get(gerente_id);
  }
}

export default new PainelRepository();
