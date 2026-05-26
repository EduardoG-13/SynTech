export type CategoriaAnimal = 'bezerro' | 'garrote' | 'boi_touro' | 'bezerra' | 'novilha' | 'vaca';

export type PayloadNascimento = {
  retiroId: string;
  responsavelId: string;
  categoria: CategoriaAnimal | string;
  dataMovimentacao: string;
  quantidade: number;
  raca?: string;
  observacoes?: string;
};

export type RegistroNascimento = {
  id: string;
  retiroId: string;
  responsavelId: string;
  tipo: 'nascimento';
  categoria: string;
  dataMovimentacao: string;
  quantidade: number;
  raca: string | null;
  syncStatus: string;
};

export type NascimentoCreateData = {
  payload: PayloadNascimento;
  movimentacaoId: string;
  nascimentoId: string;
  syncQueueId: string;
  retiroId: string;
  responsavelId: string;
  categoria: string;
  dataMovimentacao: string;
  observacoes?: string;
  quantidade: number;
  raca?: string;
};
