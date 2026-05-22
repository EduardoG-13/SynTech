export type PerfilUsuario = 'Gerente' | 'Coordenador' | 'Capataz' | 'Tecnico';

export interface Usuario {
  id: string;
  nome: string;
  senha?: string; // Optional because we usually don't want to expose it
  perfil: PerfilUsuario;
  retiro_id?: string | null;
  criado_em?: string;
}
