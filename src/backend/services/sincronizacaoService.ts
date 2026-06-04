import sincronizacaoRepository from '../repositories/sincronizacaoRepository';
import db from '../config/database';

interface ItemSincronizacao {
  entidade_tipo: 'tarefa' | 'alerta' | 'movimentacao' | 'evidencia';
  dados: any;
}

interface ResultadoItem {
  entidade_tipo: string;
  entidade_id: string | null;
  status: 'SINCRONIZADO' | 'ERRO';
  erro?: string;
}

class SincronizacaoService {
  /**
   * Processa um lote de entidades heterogêneas recebidas de clientes offline.
   * Cada item é processado individualmente em transação isolada.
   * Registra o resultado na tabela sincronizacoes.
   *
   * RF010: Sincronização automática ao reconectar
   * RF011: Notificação de sucesso
   * RF012: Reenvio automático em caso de falha
   */
  processarLote(itens: ItemSincronizacao[]): { processados: number; sucessos: number; erros: number; resultados: ResultadoItem[] } {
    const resultados: ResultadoItem[] = [];
    let sucessos = 0;
    let erros = 0;

    for (const item of itens) {
      let entidade_id: string | null = null;
      try {
        db.exec('BEGIN TRANSACTION');

        switch (item.entidade_tipo) {
          case 'tarefa':
            this.validarCamposTarefa(item.dados);
            entidade_id = sincronizacaoRepository.inserirTarefa(item.dados);
            break;

          case 'alerta':
            this.validarCamposAlerta(item.dados);
            entidade_id = sincronizacaoRepository.inserirAlerta(item.dados);
            break;

          case 'movimentacao':
            this.validarCamposMovimentacao(item.dados);
            entidade_id = sincronizacaoRepository.inserirMovimentacao(item.dados);
            break;

          case 'evidencia':
            this.validarCamposEvidencia(item.dados);
            entidade_id = sincronizacaoRepository.inserirEvidencia(item.dados);
            break;

          default:
            throw new Error(`Tipo de entidade desconhecido: ${item.entidade_tipo}`);
        }

        // Registrar na tabela de sincronizações como PENDENTE para sincronizar com Supabase
        sincronizacaoRepository.registrar(item.entidade_tipo, entidade_id, 'PENDENTE');
        db.exec('COMMIT');

        resultados.push({ entidade_tipo: item.entidade_tipo, entidade_id, status: 'SINCRONIZADO' });
        sucessos++;
      } catch (err) {
        try { db.exec('ROLLBACK'); } catch (_) { /* rollback silencioso */ }

        const mensagemErro = (err as Error).message;
        if (entidade_id) {
          try {
            sincronizacaoRepository.registrar(item.entidade_tipo, entidade_id || 'desconhecido', 'ERRO');
          } catch (_) { /* registro de erro silencioso */ }
        }

        resultados.push({
          entidade_tipo: item.entidade_tipo,
          entidade_id: item.dados?.id || null,
          status: 'ERRO',
          erro: mensagemErro
        });
        erros++;
      }
    }

    return {
      processados: itens.length,
      sucessos,
      erros,
      resultados
    };
  }

  private validarCamposTarefa(dados: any) {
    if (!dados.titulo) throw new Error('Campo obrigatório ausente: titulo');
    if (!dados.data_execucao) throw new Error('Campo obrigatório ausente: data_execucao');
    if (!dados.retiro_id) throw new Error('Campo obrigatório ausente: retiro_id');
    if (!dados.capataz_id) throw new Error('Campo obrigatório ausente: capataz_id');
    if (!dados.gerente_id) throw new Error('Campo obrigatório ausente: gerente_id');
  }

  private validarCamposAlerta(dados: any) {
    if (!dados.tipo) throw new Error('Campo obrigatório ausente: tipo');
    if (!dados.capataz_id) throw new Error('Campo obrigatório ausente: capataz_id');
    if (!dados.retiro_id) throw new Error('Campo obrigatório ausente: retiro_id');
    if (dados.latitude === undefined || dados.latitude === null) throw new Error('Campo obrigatório ausente: latitude');
    if (dados.longitude === undefined || dados.longitude === null) throw new Error('Campo obrigatório ausente: longitude');
  }

  private validarCamposMovimentacao(dados: any) {
    if (!dados.capataz_id) throw new Error('Campo obrigatório ausente: capataz_id');
    if (!dados.retiro_id) throw new Error('Campo obrigatório ausente: retiro_id');
    if (!dados.data) throw new Error('Campo obrigatório ausente: data');
    if (!dados.categoria) throw new Error('Campo obrigatório ausente: categoria');
    if (!dados.quantidade) throw new Error('Campo obrigatório ausente: quantidade');
  }

  private validarCamposEvidencia(dados: any) {
    if (!dados.tipo) throw new Error('Campo obrigatório ausente: tipo');
    // Pelo menos uma referência deve existir
    if (!dados.tarefa_id && !dados.alerta_id && !dados.movimentacao_id) {
      throw new Error('Evidência deve estar vinculada a uma tarefa, alerta ou movimentação');
    }
  }
}

export default new SincronizacaoService();
