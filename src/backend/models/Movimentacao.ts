export type CategoriaMovimentacao = 'BEZERRO' | 'GARROTE' | 'BOI_TOURO' | 'BEZERRA' | 'NOVILHA' | 'VACA';

export interface MovimentacaoBase {
  id: string;
  capataz_id: string;
  retiro_id: string;
  data: string;
  categoria: CategoriaMovimentacao | string;
  quantidade: number;
  sincronizado?: boolean | number;
  validado?: boolean | number;
  coordenador_id?: string | null;
  criado_em?: string;
}

export interface Nascimento extends MovimentacaoBase {
  // A constraint from the database structure where Nascimento uses the ID from Movimentacoes
}

export interface Obito extends MovimentacaoBase {
  identificacao_animal: string;
  causa_morte: string;
  foto_id: string;
}

export interface Transferencia extends MovimentacaoBase {
  retiro_origem_id: string;
  retiro_destino_id: string;
}

export interface Compravenda extends MovimentacaoBase {
  tipo_negocio: 'COMPRA' | 'VENDA';
  valor_financeiro: number;
}
