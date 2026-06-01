import supabasePool from '../../config/supabasePool';

class TarefaPgRepository {
  /**
   * Salva ou atualiza (UPSERT) uma tarefa no Supabase
   */
  async salvarOuAtualizar(tarefa: any) {
    const query = `
      INSERT INTO tarefas (
        id,
        titulo,
        descricao,
        status,
        data_execucao,
        retiro_id,
        capataz_id,
        gerente_id,
        criada_em,
        concluida_em,
        sincronizada
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, TRUE
      )
      ON CONFLICT (id)
      DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descricao = EXCLUDED.descricao,
        status = EXCLUDED.status,
        concluida_em = EXCLUDED.concluida_em,
        sincronizada = TRUE;
    `;

    await supabasePool.query(query, [
      tarefa.id,
      tarefa.titulo,
      tarefa.descricao || null,
      tarefa.status || 'PENDENTE',
      tarefa.data_execucao,
      tarefa.retiro_id,
      tarefa.capataz_id,
      tarefa.gerente_id,
      tarefa.criada_em,
      tarefa.concluida_em || null
    ]);
  }
}

export default new TarefaPgRepository();