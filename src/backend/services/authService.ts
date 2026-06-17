import bcrypt from 'bcryptjs';
import usuarioRepository from '../repositories/usuarioRepository';
import { JwtUserPayload } from '../config/auth';

class AuthService {
  /**
   * Autentica um usuário padrão (Gerente, Coordenador, etc)
   * validando as credenciais e retornando o payload do JWT se sucesso.
   */
  autenticar(usuario: string, senhaLimpa: string, perfil: string): JwtUserPayload {
    const row = usuarioRepository.buscarPorNomeEPerfil(usuario, perfil) as any;

    if (!row) {
      throw new Error('Usuário não encontrado.');
    }

    const senhaValida = bcrypt.compareSync(senhaLimpa, row.senha);

    if (!senhaValida) {
      throw new Error('Senha incorreta.');
    }

    const usuarioAutenticado: JwtUserPayload = {
      id: row.id,
      nome: row.nome,
      perfil: row.perfil,
      retiro_id: row.retiro_id,
      is_admin: row.is_admin === 1 || row.is_admin === true,
    };

    return usuarioAutenticado;
  }

  /**
   * Autentica um Capataz através apenas da seleção do retiro.
   */
  autenticarCapataz(retiro_id: string): JwtUserPayload {
    const row = usuarioRepository.buscarCapatazPorRetiro(retiro_id) as any;

    if (!row) {
      throw new Error('Nenhum capataz vinculado a este retiro.');
    }

    const usuarioAutenticado: JwtUserPayload = {
      id: row.id,
      nome: row.nome,
      perfil: row.perfil,
      retiro_id: row.retiro_id,
    };

    return usuarioAutenticado;
  }

  /**
   * Autentica os técnicos de infraestrutura baseando-se apenas na categoria.
   */
  autenticarInfra(categoria: string): JwtUserPayload {
    return {
      id: 'tecnico-' + categoria,
      nome: 'Técnico ' + categoria,
      perfil: 'Infraestrutura',
      retiro_id: null,
      categoria: categoria,
    };
  }
}

export default new AuthService();
