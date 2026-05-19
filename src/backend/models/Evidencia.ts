export type TipoEvidencia = 'FOTO' | 'AUDIO' | 'VIDEO' | 'DOCUMENTO' | 'TEXTO';

export interface Evidencia {
  id: string;
  tarefa_id?: string | null;
  alerta_id?: string | null;
  movimentacao_id?: string | null;
  tipo: TipoEvidencia;
  arquivo_base64?: string | null;
  url_arquivo?: string | null;
  geolocalizacao?: string | null;
  duracao_segundos?: number | null;
  conteudo?: string | null;
  tamanho_bytes?: number | null;
  criada_em?: string;
  sincronizada?: boolean | number;
}
