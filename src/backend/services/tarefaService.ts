import tarefaRepository from '../repositories/tarefaRepository';
import usuarioRepository from '../repositories/usuarioRepository';

class TarefaService {
  async criarTarefa(dados: any): Promise<any> {
    const hojeStr = new Date().toISOString().split('T')[0];
    if (dados.data_execucao < hojeStr) {
      throw new Error('A data de agendamento não pode ser retroativa.');
    }

    if (typeof dados.descricao === 'string' && dados.descricao.trim() === '') {
      throw new Error('A descrição não pode estar em branco.');
    }

    const capataz = usuarioRepository.buscarPorId(dados.capataz_id) as any;
    if (!capataz || capataz.perfil !== 'Capataz') {
      throw new Error('Usuário informado não é um Capataz válido.');
    }
    if (capataz.retiro_id !== dados.retiro_id) {
      throw new Error('RN01: Capataz não pertence ao retiro informado.');
    }

    return await tarefaRepository.criar(dados);
  }

  async buscarTarefasHoje(capataz_id) {
    const hoje = new Date().toISOString().split('T')[0];
    return await tarefaRepository.buscarTarefasHoje(capataz_id, hoje);
  }

  async concluirTarefa(
    tarefa_id: string,
    capataz_id: string
  ): Promise<any> {
    const tarefaAtual = await tarefaRepository.buscarPorId(tarefa_id);

    if (!tarefaAtual || tarefaAtual.capataz_id !== capataz_id) {
      throw new Error('Tarefa não encontrada ou não pertence ao capataz.');
    }

    if (tarefaAtual.status === 'CONCLUIDA') {
      throw new Error('Tarefa já está concluída.');
    }

    const data_conclusao = new Date().toISOString();
    const tarefa = await tarefaRepository.concluir(tarefa_id, capataz_id, data_conclusao);
    if (!tarefa) {
      throw new Error('Tarefa não encontrada ou não pertence ao capataz.');
    }
    return tarefa;
  }

  async anexarEvidencia(tarefa_id, capataz_id, dados) {
    // Verificar se a tarefa pertence ao capataz
    const tarefa = await tarefaRepository.buscarPorId(tarefa_id);
    if (!tarefa || tarefa.capataz_id !== capataz_id) {
      throw new Error('RN05: Tarefa não encontrada ou não pertence ao capataz.');
    }

    const evidencia_id = await tarefaRepository.salvarEvidencia(
      tarefa_id,
      dados.tipo,
      dados.arquivo_base64 || null,
      dados.geolocalizacao || null
    );

    return { evidencia_id };
  }
}

export default new TarefaService();
