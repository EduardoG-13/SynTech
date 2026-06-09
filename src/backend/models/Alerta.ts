export type TipoAlerta = 'CERCA' | 'BEBEDOURO' | 'HIDRAULICA' | 'ELETRICA' | 'INFRAESTRUTURA' | 'OUTRO';
export type StatusAlerta = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO';

export interface Alerta {
  id: string;
  tipo: TipoAlerta | string;
  descricao?: string | null;
  status: StatusAlerta;
  capataz_id: string;
  retiro_id: string;
  latitude: number;
  longitude: number;
  criado_em?: string;
  sincronizado?: boolean | number;
  foto_id?: string | null;
  tecnico_id?: string | null;
  solucao_resolucao?: string | null;
  resolvido_em?: string | null;
}
