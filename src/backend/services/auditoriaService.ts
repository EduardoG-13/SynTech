import auditoriaRepository, { RegistroAuditoria } from '../repositories/auditoriaRepository';

class AuditoriaService {
  registrar(registro: RegistroAuditoria) {
    try {
      return auditoriaRepository.registrar(registro);
    } catch (erro) {
      console.warn('[auditoria] falha ao registrar ação:', (erro as Error).message);
      return null;
    }
  }

  listar(limite?: number) {
    return auditoriaRepository.listar(limite);
  }
}

export default new AuditoriaService();
