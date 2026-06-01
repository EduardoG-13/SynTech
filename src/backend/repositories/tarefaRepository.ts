import supabasePool from '../config/supabasePool';
import { v7 as uuidv7 } from 'uuid';

class TarefaRepository {
  async criar(tarefa: any): Promise<any> {
    const id = uuidv7();

    const result = await supabasePool.query(
      `
      INSERT INTO tarefas (
        id, titulo, descricao, status, data_execucao,
        retiro_id, capataz_id, gerente_id, sincronizada
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        id,
        tarefa.titulo,
        tarefa.descricao || null,
        'PENDENTE',
        tarefa.data_execucao,
        tarefa.retiro_id,
        tarefa.capataz_id,
        tarefa.gerente_id,
        1
      ]
    );

    return result.rows[0];
  }

  async buscarPorId(id: string): Promise<any | null> {
    const result = await supabasePool.query(
      'SELECT * FROM tarefas WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  async buscarTarefasHoje(
    capataz_id: string,
    data_hoje: string
  ): Promise<any[]> {
    const result = await supabasePool.query(
      `
      SELECT *
      FROM tarefas
      WHERE capataz_id = $1
      AND DATE(data_execucao) = DATE($2)
      `,
      [capataz_id, data_hoje]
    );

    return result.rows;
  }

  async concluir(
    id: string,
    capataz_id: string,
    data_conclusao: string
  ): Promise<any | false> {
    const result = await supabasePool.query(
      `
      UPDATE tarefas
      SET status = 'CONCLUIDA',
          concluida_em = $1,
          sincronizada = 1
      WHERE id = $2
      AND capataz_id = $3
      RETURNING *
      `,
      [data_conclusao, id, capataz_id]
    );

    if (result.rowCount === 0) {
      return false;
    }

    return result.rows[0];
  }

  async salvarEvidencia(
    tarefa_id: string,
    tipo: string,
    arquivo_base64: string,
    geolocalizacao: string
  ): Promise<string> {
    const id = uuidv7();

    await supabasePool.query(
      `
      INSERT INTO evidencias (
        id, tarefa_id, tipo, arquivo_base64, geolocalizacao, sincronizada
      )
      VALUES ($1, $2, $3, $4, $5, 1)
      `,
      [id, tarefa_id, tipo, arquivo_base64, geolocalizacao]
    );

    return id;
  }
}

export default new TarefaRepository();