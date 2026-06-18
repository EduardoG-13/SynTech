import bcrypt from 'bcryptjs';
import authRepository from '../repositories/authRepository';

class AuthService {
  public autenticarUsuario(nome: string, senhaLimpa: string, perfil: string) {
    const usuario = authRepository.buscarUsuarioPorNomeEPerfil(nome, perfil);
    if (!usuario) {
      return null;
    }

    const senhaValida = bcrypt.compareSync(senhaLimpa, usuario.senha);
    if (!senhaValida) {
      return null;
    }

    return usuario;
  }

  public autenticarCapatazPorRetiro(retiro_id: string) {
    return authRepository.buscarCapatazPorRetiro(retiro_id);
  }
}

export default new AuthService();
