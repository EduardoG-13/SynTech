import supabasePool from '../config/supabasePool';
import { v7 as uuidv7 } from 'uuid';

class AlertaRepository {
  async criar(alerta: any): Promise<any> {
    const id = uuidv7();

    const result = await supabasePool.query(
      `
      INSERT INTO alertas (
        id, tipo, descricao, status, capataz_id,
        retiro_id, latitude, longitude, sincronizado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        id,
        alerta.tipo,
        alerta.descricao || null,
        'ABERTO',
        alerta.capataz_id,
        alerta.retiro_id,
        alerta.latitude,
        alerta.longitude,
        1
      ]
    );

    return result.rows[0];
  }

  async buscarPorId(id: string): Promise<any | null> {
    const result = await supabasePool.query(
      'SELECT * FROM alertas WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  async buscarUsuarioPorId(id: string): Promise<any | null> {
    const result = await supabasePool.query(
      'SELECT id, perfil FROM usuarios WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  async listar(status?: string): Promise<any[]> {
    if (status) {
      const result = await supabasePool.query(
        `
        SELECT *
        FROM alertas
        WHERE status = $1
        ORDER BY criado_em DESC
        `,
        [status]
      );

      return result.rows;
    }

    const result = await supabasePool.query(
      `
      SELECT *
      FROM alertas
      ORDER BY criado_em DESC
      `
    );

    return result.rows;
  }

  async resolver(
    id: string,
    tecnico_id: string,
    solucao: string,
    foto_base64: string
  ): Promise<any | null> {
    const evidenciaId = uuidv7();

    const client = await supabasePool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `
        INSERT INTO evidencias (
          id, alerta_id, tipo, arquivo_base64, sincronizada
        )
        VALUES ($1, $2, 'FOTO', $3, 1)
        `,
        [evidenciaId, id, foto_base64]
      );

      const result = await client.query(
        `
        UPDATE alertas
        SET status = 'RESOLVIDO',
            tecnico_id = $1,
            foto_id = $2,
            solucao_resolucao = $3,
            resolvido_em = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
        `,
        [tecnico_id, evidenciaId, solucao, id]
      );

      await client.query('COMMIT');

      return result.rows[0] || null;
    } catch (erro) {
      await client.query('ROLLBACK');
      throw erro;
    } finally {
      client.release();
    }
  }
}

export default new AlertaRepository();