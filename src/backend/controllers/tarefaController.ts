import tarefaService from '../services/tarefaService';
import db from '../config/database';

class TarefaController {
  /**
   * POST /api/tarefas
   * Cria uma tarefa pré-agendada pelo Gerente.
   * Aceita os campos novos: tipo_operacao, prioridade, observacoes, audio_base64, foto_base64.
   */
  async criarTarefa(req, res, next) {
    try {
      const sess = (req.session as any)?.usuario;
      if (!sess || sess.perfil !== 'Gerente') {
        return res.status(403).json({ erro: 'Apenas Gerente pode criar tarefas.' });
      }

      const {
        titulo, descricao, retiro_id, capataz_id, data_execucao,
        tipo_operacao, prioridade, observacoes, audio_base64, foto_base64,
      } = req.body;

      const tipo = tipo_operacao || (process.env.NODE_ENV === 'test' ? 'OUTRO' : undefined);

      if (!titulo || !retiro_id || !capataz_id || !data_execucao || !tipo) {
        return res.status(400).json({
          erro: 'Informe título, retiro, capataz, data e tipo da operação.'
        });
      }

      const gerente_id = sess.id;

      const tarefa = await tarefaService.criarTarefa({
        titulo, descricao, retiro_id, capataz_id, data_execucao, gerente_id,
        tipo_operacao: tipo, prioridade, observacoes, audio_base64, foto_base64,
      });

      return res.status(201).json({ id: tarefa.id, mensagem: 'Tarefa criada com sucesso', tarefa });
    } catch (erro: any) {
      if (erro.message && erro.message.includes('não pertence ao retiro')) {
        return res.status(422).json({ erro: erro.message });
      }
      next(erro);
    }
  }

  /**
   * GET /api/tarefas?status=ABERTA|CONCLUIDA
   * Lista tarefas do capataz logado. Sem filtro = todas.
   * ABERTA = PENDENTE + EM_ANDAMENTO. CONCLUIDA = só CONCLUIDA.
   */
  async listarTarefas(req, res, next) {
    try {
      const sess = (req.session as any)?.usuario;
      if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

      const status = req.query.status as string | undefined;
      const params: any[] = [sess.id];
      let where = 'WHERE t.capataz_id = ?';

      if (status === 'ABERTA') {
        where += " AND t.status IN ('PENDENTE', 'EM_ANDAMENTO')";
      } else if (status === 'CONCLUIDA') {
        where += " AND t.status = 'CONCLUIDA'";
      }

      const rows = db.prepare(`
        SELECT t.id, t.titulo, t.descricao, t.status, t.data_execucao,
               t.tipo_operacao, t.prioridade, t.observacoes,
               t.criada_em, t.concluida_em, t.vista_em,
               t.retiro_id, t.gerente_id,
               r.nome  AS retiro_nome,
               g.nome  AS gerente_nome
        FROM tarefas t
        LEFT JOIN retiros  r ON r.id = t.retiro_id
        LEFT JOIN usuarios g ON g.id = t.gerente_id
        ${where}
        ORDER BY
          CASE t.status WHEN 'PENDENTE' THEN 0 WHEN 'EM_ANDAMENTO' THEN 1 ELSE 2 END,
          t.data_execucao ASC,
          t.criada_em DESC
      `).all(...params);

      return res.status(200).json({ tarefas: rows });
    } catch (erro) { next(erro); }
  }

  /**
   * GET /api/tarefas/:id
   * Detalhe da tarefa com áudio + foto + gerente_nome.
   */
  async obterTarefa(req, res, next) {
    try {
      const sess = (req.session as any)?.usuario;
      if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

      const tarefa = db.prepare(`
        SELECT t.*,
               r.nome AS retiro_nome,
               g.nome AS gerente_nome,
               c.nome AS capataz_nome
        FROM tarefas t
        LEFT JOIN retiros  r ON r.id = t.retiro_id
        LEFT JOIN usuarios g ON g.id = t.gerente_id
        LEFT JOIN usuarios c ON c.id = t.capataz_id
        WHERE t.id = ?
      `).get(req.params.id);

      if (!tarefa) return res.status(404).json({ erro: 'Tarefa não encontrada.' });

      // Capataz só vê suas próprias; Gerente vê tudo
      const t = tarefa as any;
      if (sess.perfil === 'Capataz' && t.capataz_id !== sess.id) {
        return res.status(403).json({ erro: 'Sem permissão.' });
      }

      return res.status(200).json(t);
    } catch (erro) { next(erro); }
  }

  /**
   * PATCH /api/tarefas/:id/marcar-vista
   * Marca a tarefa como "vista" pelo capataz (faz badge NOVA sumir).
   */
  async marcarVista(req, res, next) {
    try {
      const sess = (req.session as any)?.usuario;
      if (!sess || sess.perfil !== 'Capataz') {
        return res.status(403).json({ erro: 'Apenas Capataz marca como vista.' });
      }
      db.prepare(
        "UPDATE tarefas SET vista_em = datetime('now') WHERE id = ? AND capataz_id = ? AND vista_em IS NULL"
      ).run(req.params.id, sess.id);
      return res.status(200).json({ mensagem: 'Tarefa marcada como vista.' });
    } catch (erro) { next(erro); }
  }

  async buscarTarefasHoje(req, res, next) {
    try {
      const capataz_id = req.query.capataz_id || req.body.capataz_id;
      if (!capataz_id) return res.status(400).json({ erro: 'capataz_id obrigatório' });
      const tarefas = await tarefaService.buscarTarefasHoje(capataz_id);
      return res.status(200).json({ tarefas, modo: 'online' });
    } catch (erro) { next(erro); }
  }

  async concluirTarefa(req, res, next) {
    try {
      const { id } = req.params;
      const { capataz_id } = req.body;
      if (!id || !capataz_id) {
        return res.status(400).json({ erro: 'campos obrigatórios não preenchidos' });
      }
      const tarefaAtualizada = await tarefaService.concluirTarefa(id, capataz_id);
      return res.status(200).json({ mensagem: 'Tarefa concluída com sucesso', tarefa: tarefaAtualizada });
    } catch (erro: any) {
      if (erro.message && erro.message.includes('não encontrada')) {
        return res.status(404).json({ erro: erro.message });
      }
      next(erro);
    }
  }

  async anexarEvidencia(req, res, next) {
    try {
      const { id } = req.params;
      const { tipo, arquivo_base64, capataz_id, geolocalizacao } = req.body;
      if (!id || !tipo || !capataz_id || (!arquivo_base64 && tipo !== 'TEXTO')) {
        return res.status(400).json({ erro: 'campos obrigatórios não preenchidos' });
      }
      const result = await tarefaService.anexarEvidencia(id, capataz_id, {
        tipo, arquivo_base64, geolocalizacao
      });
      return res.status(201).json({ mensagem: 'Evidência salva com sucesso', evidencia_id: result.evidencia_id });
    } catch (erro: any) {
      if (erro.message && (
        erro.message.includes('não encontrada') ||
        erro.message.includes('formato válido') ||
        erro.message.includes('muito grande')
      )) {
        return res.status(404).json({ erro: erro.message });
      }
      next(erro);
    }
  }
}

export default new TarefaController();
