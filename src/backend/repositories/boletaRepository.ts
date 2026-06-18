import db from '../config/database';

class BoletaRepository {
  public iniciarTransacao() {
    db.exec('BEGIN TRANSACTION;');
  }

  public commit() {
    db.exec('COMMIT;');
  }

  public rollback() {
    db.exec('ROLLBACK;');
  }

  public enfileirarSync(entidade: string, id: string, uuid: string) {
    db.prepare(
      `INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
       VALUES (?, ?, ?, 'PENDENTE', 0)`
    ).run(uuid, entidade, id);
  }

  public inserirMovimentacao(movParams: any[]) {
    db.prepare(`
      INSERT INTO movimentacoes (
        id, capataz_id, retiro_id, data, categoria, quantidade,
        tipo_operacao, grupo_id,
        pasto, observacoes, observacoes_audio_base64, tem_foto, foto_base64,
        raca, brinco, causa_morte,
        tipo_negocio, valor_financeiro,
        retiro_origem_id, retiro_destino_id, tipo_transporte, motorista, rg_cpf_motorista, placa,
        titulo,
        sincronizado, validado, criado_em
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?,
        0, 0, ?
      )
    `).run(...movParams);
  }

  public buscarBoleta(grupoId: string, capatazId: string) {
    return db.prepare(
      `SELECT * FROM movimentacoes WHERE grupo_id = ? AND capataz_id = ?`
    ).all(grupoId, capatazId) as any[];
  }

  public excluirBoleta(grupoId: string, capatazId: string) {
    db.prepare(`DELETE FROM movimentacoes WHERE grupo_id = ? AND capataz_id = ?`).run(grupoId, capatazId);
  }

  public listarMinhasBoletas(capatazId: string) {
    return db.prepare(`
      SELECT m.*, r.nome AS retiro_nome
      FROM movimentacoes m
      LEFT JOIN retiros r ON r.id = m.retiro_id
      WHERE m.capataz_id = ?
      ORDER BY m.criado_em DESC
    `).all(capatazId) as any[];
  }

  public detalharBoleta(grupoId: string) {
    return db.prepare(`
      SELECT m.*,
             r.nome  AS retiro_nome,
             u.nome  AS capataz_nome,
             ro.nome AS retiro_origem_nome,
             rd.nome AS retiro_destino_nome,
             c.nome  AS aprovado_por_nome
      FROM movimentacoes m
      LEFT JOIN retiros  r  ON r.id  = m.retiro_id
      LEFT JOIN usuarios u  ON u.id  = m.capataz_id
      LEFT JOIN retiros  ro ON ro.id = m.retiro_origem_id
      LEFT JOIN retiros  rd ON rd.id = m.retiro_destino_id
      LEFT JOIN usuarios c  ON c.id  = m.aprovado_por_coordenador_id
      WHERE m.grupo_id = ? OR m.id = ?
      ORDER BY m.criado_em
    `).all(grupoId, grupoId) as any[];
  }
}

export default new BoletaRepository();
