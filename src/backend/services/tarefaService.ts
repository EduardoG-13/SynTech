import tarefaRepository from '../repositories/tarefaRepository';

class TarefaService {
  criarTarefa(dados) {
    // RN01: O capataz deve estar vinculado ao retiro informado
    const capataz = tarefaRepository.buscarUsuario(dados.capataz_id);
    if (!capataz || capataz.perfil !== 'Capataz') {
      throw new Error('Usuário informado não é um Capataz válido.');
    }
    if (capataz.retiro_id !== dados.retiro_id) {
      throw new Error('RN01: Capataz não pertence ao retiro informado.');
    }

    return tarefaRepository.criar(dados);
  }

  buscarTarefasHoje(capataz_id) {
    const hoje = new Date().toISOString().split('T')[0];
    return tarefaRepository.buscarTarefasHoje(capataz_id, hoje);
  }

  concluirTarefa(tarefa_id, capataz_id) {
    const data_conclusao = new Date().toISOString();
    const tarefa = tarefaRepository.concluir(tarefa_id, capataz_id, data_conclusao);
    if (!tarefa) {
      throw new Error('Tarefa não encontrada ou não pertence ao capataz.');
    }
    return tarefa;
  }

  anexarEvidencia(tarefa_id, capataz_id, dados) {
    // Verificar se a tarefa pertence ao capataz
    const tarefa = tarefaRepository.buscarPorId(tarefa_id);
    if (!tarefa || tarefa.capataz_id !== capataz_id) {
      throw new Error('RN05: Tarefa não encontrada ou não pertence ao capataz.');
    }

    const evidencia_id = tarefaRepository.salvarEvidencia(
      tarefa_id,
      dados.tipo,
      dados.arquivo_base64 || null,
      dados.geolocalizacao || null
    );

    return { evidencia_id };
  }
}

export default new TarefaService();


