export type StatusTarefa = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string | null;
  status: StatusTarefa;
  data_execucao: string;
  retiro_id: string;
  capataz_id: string;
  gerente_id: string;
  criada_em?: string;
  concluida_em?: string | null;
  sincronizada?: boolean | number;
}
