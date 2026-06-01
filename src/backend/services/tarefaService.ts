import tarefaRepository from '../repositories/tarefaRepository';
import usuarioRepository from '../repositories/usuarioRepository';

class TarefaService {
<<<<<<< HEAD
  async criarTarefa(dados) {
    // RN01: O capataz deve estar vinculado ao retiro informado
    const capataz = await usuarioRepository.buscarPorId(dados.capataz_id);
=======
  async criarTarefa(dados: any): Promise<any> {
    const capataz = usuarioRepository.buscarPorId(dados.capataz_id);

>>>>>>> 45edc12153f9d9d2666bbd5ec28e37ee59eee583
    if (!capataz || capataz.perfil !== 'Capataz') {
      throw new Error('Usuário informado não é um Capataz válido.');
    }

    if (capataz.retiro_id !== dados.retiro_id) {
      throw new Error('RN01: Capataz não pertence ao retiro informado.');
    }

    return await tarefaRepository.criar(dados);
  }

<<<<<<< HEAD
  async buscarTarefasHoje(capataz_id) {
    const hoje = new Date().toISOString().split('T')[0];
    return await tarefaRepository.buscarTarefasHoje(capataz_id, hoje);
  }

  async concluirTarefa(tarefa_id, capataz_id) {
    const data_conclusao = new Date().toISOString();
    const tarefa = await tarefaRepository.concluir(tarefa_id, capataz_id, data_conclusao);
=======
  async buscarTarefasHoje(capataz_id: string): Promise<any[]> {
    const hoje = new Date().toISOString().split('T')[0];

    return await tarefaRepository.buscarTarefasHoje(capataz_id, hoje);
  }

  async concluirTarefa(
    tarefa_id: string,
    capataz_id: string
  ): Promise<any> {
    const data_conclusao = new Date().toISOString();

    const tarefa = await tarefaRepository.concluir(
      tarefa_id,
      capataz_id,
      data_conclusao
    );

>>>>>>> 45edc12153f9d9d2666bbd5ec28e37ee59eee583
    if (!tarefa) {
      throw new Error('Tarefa não encontrada ou não pertence ao capataz.');
    }

    return tarefa;
  }

<<<<<<< HEAD
  async anexarEvidencia(tarefa_id, capataz_id, dados) {
    // Verificar se a tarefa pertence ao capataz
    const tarefa = await tarefaRepository.buscarPorId(tarefa_id);
=======
  async anexarEvidencia(
    tarefa_id: string,
    capataz_id: string,
    dados: any
  ): Promise<any> {
    const tarefa = await tarefaRepository.buscarPorId(tarefa_id);

>>>>>>> 45edc12153f9d9d2666bbd5ec28e37ee59eee583
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