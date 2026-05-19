export interface Sincronizacao {
  id: string;
  entidade_tipo: string;
  entidade_id: string;
  status_envio: 'PENDENTE' | 'PROCESSANDO' | 'ERRO' | 'SINCRONIZADO';
  tentativas?: number;
  ultima_tentativa?: string | null;
  criada_em?: string;
}
