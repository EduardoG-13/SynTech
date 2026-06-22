export interface Exportacao {
  id: string;
  coordenador_id: string;
  formato: 'EXCEL' | 'CSV' | string;
  filtro_retiro?: string | null;
  filtro_data_inicio?: string | null;
  filtro_data_fim?: string | null;
  gerada_em?: string;
}
