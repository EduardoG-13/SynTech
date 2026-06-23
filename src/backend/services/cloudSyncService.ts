import db from '../config/database';
import cloudSyncRepository from '../repositories/cloudSyncRepository';

const MAX_TENTATIVAS_CLOUD = 10;

class CloudSyncService {
  private active = false;

  async sincronizar(): Promise<void> {
    if (this.active) return;
    this.active = true;

    try {
      // 1. Query pending items — ORDEM TOPOLÓGICA pra respeitar FKs do Postgres
      // retiro/usuario (raiz) → evidencia → tarefa/movimentacao/alerta (filhos)
      const pending = db.prepare(`
        SELECT * FROM sincronizacoes
        WHERE status_envio IN ('PENDENTE', 'ERRO') AND tentativas < ?
        ORDER BY
          CASE entidade_tipo
            WHEN 'retiro'       THEN 0
            WHEN 'usuario'      THEN 1
            WHEN 'evidencia'    THEN 2
            WHEN 'tarefa'       THEN 3
            WHEN 'movimentacao' THEN 4
            WHEN 'alerta'       THEN 5
            ELSE 9
          END ASC,
          criada_em ASC
      `).all(MAX_TENTATIVAS_CLOUD) as any[];

      if (pending.length === 0) {
        this.active = false;
        return;
      }

      // 2. Check connection to Supabase
      try {
        await cloudSyncRepository.verificarConexaoSupabase();
      } catch (err) {
        console.log('[cloudSync] Sem conexão com a nuvem (Supabase). Sincronização em background suspensa.');
        this.active = false;
        return;
      }

      console.log(`[cloudSync] Iniciando sincronização de ${pending.length} itens pendentes.`);

      for (const item of pending) {
        try {
          if (item.entidade_tipo === 'tarefa') {
            const tarefa = cloudSyncRepository.obterTarefaLocal(item.entidade_id);
            if (tarefa) {
              await cloudSyncRepository.inserirTarefaSupabase(tarefa);
              cloudSyncRepository.marcarTarefaLocalSincronizada(tarefa.id);
            }
          } else if (item.entidade_tipo === 'alerta') {
            const alerta = cloudSyncRepository.obterAlertaLocal(item.entidade_id);
            if (alerta) {
              await cloudSyncRepository.inserirAlertaSupabase(alerta);
              cloudSyncRepository.marcarAlertaLocalSincronizado(alerta.id);
            }
          } else if (item.entidade_tipo === 'movimentacao') {
            const mov = cloudSyncRepository.obterMovimentacaoLocal(item.entidade_id);
            if (mov) {
              const nas = cloudSyncRepository.obterNascimentoLocal(mov.id);
              const ob = cloudSyncRepository.obterObitoLocal(mov.id);
              const tr = cloudSyncRepository.obterTransferenciaLocal(mov.id);
              const cv = cloudSyncRepository.obterCompraVendaLocal(mov.id);

              await cloudSyncRepository.inserirMovimentacaoCompletaSupabase(mov, nas, ob, tr, cv);
              cloudSyncRepository.marcarMovimentacaoLocalSincronizada(mov.id);
            }
          } else if (item.entidade_tipo === 'evidencia') {
            const ev = cloudSyncRepository.obterEvidenciaLocal(item.entidade_id);
            if (ev) {
              await cloudSyncRepository.inserirEvidenciaSupabase(ev);
              cloudSyncRepository.marcarEvidenciaLocalSincronizada(ev.id);
            }
          } else if (item.entidade_tipo === 'retiro') {
            const r = cloudSyncRepository.obterRetiroLocal(item.entidade_id);
            if (r) {
              await cloudSyncRepository.inserirRetiroSupabase(r);
            }
          } else if (item.entidade_tipo === 'usuario') {
            const u = cloudSyncRepository.obterUsuarioLocal(item.entidade_id);
            if (u) {
              await cloudSyncRepository.inserirUsuarioSupabase(u);
            }
          }

          // Mark outbox entry as SINCRONIZADO
          cloudSyncRepository.marcarSincronizacaoSucesso(item.id);

        } catch (itemErr: any) {
          console.error(`[cloudSync] Falha ao sincronizar item ${item.entidade_tipo} id ${item.entidade_id}:`, itemErr.message);
          cloudSyncRepository.marcarSincronizacaoErro(item.id);
        }
      }
    } finally {
      this.active = false;
    }
  }

  iniciarAgendador(intervaloMs = 60000): NodeJS.Timeout {
    console.log(`[cloudSync] Agendador de sincronização em nuvem iniciado (intervalo: ${intervaloMs}ms)`);
    return setInterval(() => {
      this.sincronizar().catch(err => console.error('[cloudSync] Erro no ciclo de sync:', err));
    }, intervaloMs);
  }
}

export default new CloudSyncService();
