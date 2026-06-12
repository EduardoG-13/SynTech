export interface RefreshToken {
  id: string;
  usuario_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at?: string | null;
  criado_em?: string;
  atualizado_em?: string;
}
