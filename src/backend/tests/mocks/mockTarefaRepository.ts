import type { Tarefa } from '../../models/Tarefa';

function tarefaFixture(): Tarefa {
  return {
    id: 'mock-tarefa-id-0001',
    titulo: 'Inspeção de cerca',
    descricao: 'Verificar cerca do lote norte',
    status: 'PENDENTE',
    data_execucao: new Date(Date.now() + 86_400_000).toISOString().split('T')[0],
    retiro_id: 'mock-retiro-id-0001',
    capataz_id: 'mock-capataz-id-0001',
    gerente_id: 'mock-gerente-id-0001',
    criada_em: '2026-06-01T00:00:00.000Z',
    concluida_em: null,
    sincronizada: 1,
  };
}

class MockTarefaRepository {
  criar = jest.fn(async (tarefa: any): Promise<Tarefa> => ({
    ...tarefaFixture(),
    titulo: tarefa.titulo,
    descricao: tarefa.descricao ?? null,
    data_execucao: tarefa.data_execucao,
    retiro_id: tarefa.retiro_id,
    capataz_id: tarefa.capataz_id,
    gerente_id: tarefa.gerente_id,
  }));

  buscarPorId = jest.fn(async (id: string): Promise<Tarefa | null> => ({
    ...tarefaFixture(),
    id,
  }));

  buscarTarefasHoje = jest.fn(
    async (capataz_id: string, data_hoje: string): Promise<Tarefa[]> => [
      { ...tarefaFixture(), capataz_id, data_execucao: data_hoje },
    ]
  );

  concluir = jest.fn(
    async (id: string, capataz_id: string, data_conclusao: string): Promise<Tarefa | false> => ({
      ...tarefaFixture(),
      id,
      capataz_id,
      status: 'CONCLUIDA',
      concluida_em: data_conclusao,
    })
  );

  salvarEvidencia = jest.fn(
    async (
      _tarefa_id: string,
      _tipo: string,
      _arquivo_base64: string,
      _geolocalizacao: string
    ): Promise<string> => 'mock-evidencia-id-0001'
  );
}

export { MockTarefaRepository, tarefaFixture };
export default new MockTarefaRepository();
