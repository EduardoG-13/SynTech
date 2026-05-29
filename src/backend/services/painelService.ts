import painelRepository from '../repositories/painelRepository';
import usuarioRepository from '../repositories/usuarioRepository';

class PainelService {
  /**
   * Monta o objeto consolidado do painel gerencial.
   * Valida que o solicitante é um Gerente antes de retornar dados.
   */
  obterPainel(gerente_id: string) {
    // Validação: verificar se o usuário é um Gerente
    const usuario = usuarioRepository.buscarPorId(gerente_id);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }
    if ((usuario as any).perfil !== 'Gerente') {
      throw new Error('ACESSO_NEGADO: Apenas usuários com perfil Gerente podem acessar o painel gerencial.');
    }

    // Métricas de tarefas por status
    const metricasTarefas = painelRepository.obterMetricasTarefas(gerente_id);

    // Tarefas agrupadas por retiro
    const tarefasPorRetiro = painelRepository.obterTarefasPorRetiro(gerente_id);

    // Alertas (chamados) em aberto
    const alertasAbertos = painelRepository.obterAlertasAbertos();

    // Tarefas concluídas hoje
    const concluidasHoje = painelRepository.obterConcluidasHoje(gerente_id);

    // Estruturar tarefas por retiro em formato agrupado
    const retiros: Record<string, { retiro_id: string; retiro_nome: string; tarefas: Record<string, number> }> = {};
    for (const row of tarefasPorRetiro as any[]) {
      if (!retiros[row.retiro_id]) {
        retiros[row.retiro_id] = {
          retiro_id: row.retiro_id,
          retiro_nome: row.retiro_nome,
          tarefas: {}
        };
      }
      retiros[row.retiro_id].tarefas[row.status] = row.total;
    }

    // Estruturar métricas gerais
    const resumo: Record<string, number> = {
      total: 0,
      pendentes: 0,
      em_andamento: 0,
      concluidas: 0,
      concluidas_hoje: (concluidasHoje as any)?.total || 0
    };
    for (const row of metricasTarefas as any[]) {
      resumo.total += row.total;
      if (row.status === 'PENDENTE') resumo.pendentes = row.total;
      else if (row.status === 'EM_ANDAMENTO') resumo.em_andamento = row.total;
      else if (row.status === 'CONCLUIDA') resumo.concluidas = row.total;
    }

    return {
      resumo_tarefas: resumo,
      tarefas_por_retiro: Object.values(retiros),
      alertas_abertos: alertasAbertos,
      total_alertas_abertos: (alertasAbertos as any[]).length,
      gerado_em: new Date().toISOString()
    };
  }
}

export default new PainelService();
