import tarefaService from '../services/tarefaService';

class TarefaController {
  async criarTarefa(req, res, next) {
    try {
      const { titulo, descricao, retiro_id, capataz_id, data_execucao, gerente_id } = req.body;

      if (!titulo || !retiro_id || !capataz_id || !data_execucao || !gerente_id) {
        return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });
      }

      const tarefa = await tarefaService.criarTarefa({
        titulo,
        descricao,
        retiro_id,
        capataz_id,
        data_execucao,
        gerente_id
      });

      return res.status(201).json({ id: tarefa.id, mensagem: 'Tarefa criada com sucesso', tarefa });
    } catch (erro) {
      if (erro.message.includes('RN01')) {
        return res.status(422).json({ erro: erro.message });
      }
      next(erro);
    }
  }

  async buscarTarefasHoje(req, res, next) {
    try {
      const capataz_id = req.query.capataz_id || req.body.capataz_id;

      if (!capataz_id) {
        return res.status(400).json({ erro: 'capataz_id obrigatório' });
      }

      const tarefas = await tarefaService.buscarTarefasHoje(capataz_id);
      return res.status(200).json({ tarefas, modo: 'online' });
    } catch (erro) {
      next(erro);
    }
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
    } catch (erro) {
      if (erro.message.includes('não encontrada')) {
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
        tipo,
        arquivo_base64,
        geolocalizacao
      });

      return res.status(201).json({ mensagem: 'Evidência salva com sucesso', evidencia_id: result.evidencia_id });
    } catch (erro) {
      if (erro.message.includes('RN05')) {
        return res.status(404).json({ erro: erro.message });
      }
      next(erro);
    }
  }
}

export default new TarefaController();
