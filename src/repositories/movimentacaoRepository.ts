import { getDatabase } from '../database/connection';
import { NascimentoCreateData, RegistroNascimento } from '../models/Movimentacao';

export type RegistroNascimentoComFila = RegistroNascimento & {
  syncQueueTotal: number;
};

export const createNascimento = (data: NascimentoCreateData): RegistroNascimento | undefined => {
  const database = getDatabase();
  const transaction = database.transaction(() => {
    database
      .prepare(`
        INSERT INTO movimentacoes (
          id, retiro_id, responsavel_id, tipo, categoria,
          data_movimentacao, observacoes, sync_status
        )
        VALUES (?, ?, ?, 'nascimento', ?, ?, ?, 'pendente')
      `)
      .run(
        data.movimentacaoId,
        data.retiroId,
        data.responsavelId,
        data.categoria,
        data.dataMovimentacao,
        data.observacoes || null,
      );

    database
      .prepare(`
        INSERT INTO nascimentos (id, movimentacao_id, quantidade, raca)
        VALUES (?, ?, ?, ?)
      `)
      .run(data.nascimentoId, data.movimentacaoId, data.quantidade, data.raca || null);

    database
      .prepare(`
        INSERT INTO sync_queue (id, tabela, registro_id, operacao, payload_json, status)
        VALUES (?, 'movimentacoes', ?, 'insert', ?, 'pendente')
      `)
      .run(data.syncQueueId, data.movimentacaoId, JSON.stringify(data.payload));
  });

  transaction();

  return findNascimentoByMovimentacaoId(data.movimentacaoId);
};

export const findNascimentoByMovimentacaoId = (
  movimentacaoId: string,
): RegistroNascimento | undefined => {
  return getDatabase()
    .prepare(`
      SELECT
        m.id,
        m.retiro_id AS retiroId,
        m.responsavel_id AS responsavelId,
        m.tipo,
        m.categoria,
        m.data_movimentacao AS dataMovimentacao,
        m.sync_status AS syncStatus,
        n.quantidade,
        n.raca
      FROM movimentacoes m
      INNER JOIN nascimentos n ON n.movimentacao_id = m.id
      WHERE m.id = ?
    `)
    .get(movimentacaoId) as RegistroNascimento | undefined;
};

export const countSyncQueueByRegistroId = (registroId: string): number => {
  const row = getDatabase()
    .prepare('SELECT COUNT(*) AS total FROM sync_queue WHERE registro_id = ?')
    .get(registroId) as { total: number };

  return row.total;
};

export const listNascimentos = (): RegistroNascimentoComFila[] => {
  return getDatabase()
    .prepare(`
      SELECT
        m.id,
        m.retiro_id AS retiroId,
        m.responsavel_id AS responsavelId,
        m.tipo,
        m.categoria,
        m.data_movimentacao AS dataMovimentacao,
        m.sync_status AS syncStatus,
        n.quantidade,
        n.raca,
        COUNT(sq.id) AS syncQueueTotal
      FROM movimentacoes m
      INNER JOIN nascimentos n ON n.movimentacao_id = m.id
      LEFT JOIN sync_queue sq ON sq.registro_id = m.id
      WHERE m.tipo = 'nascimento'
      GROUP BY
        m.id,
        m.retiro_id,
        m.responsavel_id,
        m.tipo,
        m.categoria,
        m.data_movimentacao,
        m.sync_status,
        n.quantidade,
        n.raca
      ORDER BY m.created_at DESC
    `)
    .all() as RegistroNascimentoComFila[];
};

export const seedDemoData = (): void => {
  const db = getDatabase();

  db.prepare(`
    INSERT OR IGNORE INTO retiros (id, nome, localizacao)
    VALUES ('retiro-barra-bonita', 'Barra Bonita', 'Pantanal MS')
  `).run();

  db.prepare(`
    INSERT OR IGNORE INTO usuarios (id, retiro_id, nome, email, senha_hash, perfil)
    VALUES (
      'usuario-capataz-1',
      'retiro-barra-bonita',
      'Gabriel Galdino',
      'gabriel@example.com',
      'hash-fake',
      'capataz'
    )
  `).run();
};
