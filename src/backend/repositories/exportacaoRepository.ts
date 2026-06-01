import db from '../config/database';
import { v7 as uuidv7 } from 'uuid';

class ExportacaoRepository {
  /**
   * Consulta movimentações consolidadas com dados de retiro e capataz.
   * Suporta filtros por retiro, data_inicio e data_fim.
   */
  consultarMovimentacoesConsolidadas(filtros: {
    retiro_id?: string;
    data_inicio?: string;
    data_fim?: string;
  }) {
    let sql = `
      SELECT
        m.id,
        m.data,
        r.nome AS retiro,
        CASE
          WHEN n.id IS NOT NULL THEN 'NASCIMENTO'
          WHEN o.id IS NOT NULL THEN 'OBITO'
          WHEN t.id IS NOT NULL THEN 'TRANSFERENCIA'
          WHEN cv.id IS NOT NULL THEN 'COMPRAVENDA'
          ELSE 'OUTRO'
        END AS tipo_evento,
        m.categoria,
        m.quantidade,
        u.nome AS capataz_responsavel,
        m.criado_em
      FROM movimentacoes m
      LEFT JOIN retiros r ON r.id = m.retiro_id
      LEFT JOIN usuarios u ON u.id = m.capataz_id
      LEFT JOIN nascimentos n ON n.movimentacao_id = m.id
      LEFT JOIN obitos o ON o.movimentacao_id = m.id
      LEFT JOIN transferencias t ON t.movimentacao_id = m.id
      LEFT JOIN compravendas cv ON cv.movimentacao_id = m.id
      WHERE m.validado = 1
    `;

    const params: any[] = [];

    if (filtros.retiro_id) {
      sql += ' AND m.retiro_id = ?';
      params.push(filtros.retiro_id);
    }
    if (filtros.data_inicio) {
      sql += ' AND date(m.data) >= date(?)';
      params.push(filtros.data_inicio);
    }
    if (filtros.data_fim) {
      sql += ' AND date(m.data) <= date(?)';
      params.push(filtros.data_fim);
    }

    sql += ' ORDER BY m.data DESC, m.criado_em DESC';

    const stmt = db.prepare(sql);
    return stmt.all(...params);
  }

  /**
   * Registra a exportação na tabela de exportações para auditoria.
   */
  registrarExportacao(coordenador_id: string, formato: string, filtro_retiro?: string, filtro_data_inicio?: string, filtro_data_fim?: string) {
    const id = uuidv7();
    const stmt = db.prepare(`
      INSERT INTO exportacoes (id, coordenador_id, formato, filtro_retiro, filtro_data_inicio, filtro_data_fim)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, coordenador_id, formato, filtro_retiro || null, filtro_data_inicio || null, filtro_data_fim || null);
    return id;
  }
}

export default new ExportacaoRepository();
