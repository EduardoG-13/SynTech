import dashboardRepository from '../repositories/dashboardRepository';

interface SessUsuario { id: string; perfil: string; }

export class DashboardService {
  private retirosVisiveis(sess: SessUsuario): string[] | null {
    if (sess.perfil === 'Gerente') return null;
    return dashboardRepository.obterRetirosVisiveis(sess.id);
  }

  public obterResumo(sess: SessUsuario, filtroData: string | null) {
    const permitidos = this.retirosVisiveis(sess);

    // Boletas por retiro (top 8)
    const chamadosPorRetiro = dashboardRepository.obterChamadosPorRetiro(permitidos, filtroData);

    // Boletas (movimentações)
    const totaisBoletas = dashboardRepository.obterTotaisBoletas(permitidos, filtroData);

    // Chamados de infra por status
    const chamadosPorStatus = dashboardRepository.obterChamadosPorStatus(permitidos, filtroData);

    const totalRetiros = dashboardRepository.obterTotalRetiros(permitidos);

    // Capatazes visíveis
    const totalCapatazes = dashboardRepository.obterTotalCapatazes(permitidos);

    return {
      chamadosPorRetiro,
      boletas: totaisBoletas,
      chamados: chamadosPorStatus,
      totais: { retiros: totalRetiros, capatazes: totalCapatazes },
      escopo: sess.perfil === 'Gerente' ? 'todos' : 'meus-retiros',
    };
  }

  public listarRetirosDashboard(sess: SessUsuario) {
    const permitidos = this.retirosVisiveis(sess);
    return dashboardRepository.listarRetirosDashboard(permitidos);
  }
}

export default new DashboardService();
