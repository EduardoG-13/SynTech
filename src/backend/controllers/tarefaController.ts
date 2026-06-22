import tarefaService from '../services/tarefaService';
import { AppError } from '../utils/AppError';

class TarefaController {
  async criarTarefa(req, res, next) {
    try {
      const { titulo, descricao, retiro_id, capataz_id, data_execucao, gerente_id } = req.body;

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
      if (erro.message.includes('não pertence ao retiro')) {
        return next(new AppError(422, erro.message));
      }
      if (
        erro.message.includes('retroativa') ||
        erro.message.includes('em branco') ||
        erro.message.includes('não é um Capataz válido')
      ) {
        return next(new AppError(400, erro.message));
      }
      next(erro);
    }
  }

  async buscarTarefasHoje(req, res, next) {
    try {
      const capataz_id = req.query.capataz_id || req.body.capataz_id;

      if (!capataz_id) {
        throw new AppError(400, 'capataz_id obrigatório');
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

      const tarefaAtualizada = await tarefaService.concluirTarefa(id, capataz_id);
      return res.status(200).json({ mensagem: 'Tarefa concluída com sucesso', tarefa: tarefaAtualizada });
    } catch (erro) {
      if (erro.message.includes('não encontrada')) {
        return next(new AppError(404, erro.message));
      }
      if (erro.message.includes('já está concluída')) {
        return next(new AppError(409, erro.message));
      }
      next(erro);
    }
  }

  async anexarEvidencia(req, res, next) {
    try {
      const { id } = req.params;
      const { tipo, arquivo_base64, capataz_id, geolocalizacao } = req.body;

      if (!arquivo_base64 && tipo !== 'TEXTO') {
        throw new AppError(400, 'Arquivo base64 é obrigatório para este tipo de evidência');
      }

      const result = await tarefaService.anexarEvidencia(id, capataz_id, {
        tipo,
        arquivo_base64,
        geolocalizacao
      });

      return res.status(201).json({ mensagem: 'Evidência salva com sucesso', evidencia_id: result.evidencia_id });
    } catch (erro) {
      if (erro.message?.includes('não encontrada')) {
        return next(new AppError(404, erro.message));
      }
      if (erro.message?.includes('formato válido')) {
        return next(new AppError(400, erro.message));
      }
      if (erro.message?.includes('muito grande')) {
        return next(new AppError(413, erro.message));
      }
      next(erro);
    }
  }
}

export default new TarefaController();
