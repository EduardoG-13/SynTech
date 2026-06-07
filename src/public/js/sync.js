/**
 * Sincronizador de Lote - Processa registros offline
 * Lê todos os itens da fila e envia em lote para o servidor
 */

/**
 * Processa a fila de sincronização
 * Lê todos os registros com status PENDENTE e envia para o servidor
 * @returns {Promise<Object>} Resultado da sincronização
 */
export async function processarFilaSincronizacao() {
  try {
    console.log('[Sincronizador] Iniciando processamento da fila...');

    // Verificar se IndexedDB está disponível
    if (!window.brpecIndexedDb) {
      throw new Error('IndexedDB não está inicializado');
    }

    // Lê todos os itens da fila
    const itens = await window.brpecIndexedDb.listarFila();

    console.log(`[Sincronizador] Encontrados ${itens.length} itens na fila`);

    // Se não houver itens, retornar sucesso vazio
    if (!itens || itens.length === 0) {
      console.log('[Sincronizador] Nenhum item para sincronizar');
      return {
        sucesso: true,
        mensagem: 'Nenhum item para sincronizar',
        processados: 0,
        erros: 0,
      };
    }

    // Filtrar apenas itens com status PENDENTE
    const itensPendentes = itens.filter((item) => item.status === 'PENDENTE');

    console.log(`[Sincronizador] ${itensPendentes.length} itens com status PENDENTE`);

    // Se não houver itens pendentes, retornar sucesso
    if (itensPendentes.length === 0) {
      console.log('[Sincronizador] Nenhum item pendente para sincronizar');
      return {
        sucesso: true,
        mensagem: 'Nenhum item pendente',
        processados: 0,
        erros: 0,
      };
    }

    // Preparar payload para envio
    const payload = {
      itens: itensPendentes.map((item) => ({
        id: item.id,
        tipo: item.tipo,
        dados: item.dados,
        timestamp: item.timestamp,
      })),
    };

    console.log(
      `[Sincronizador] Preparado payload com ${payload.itens.length} itens para envio`
    );

    return {
      sucesso: true,
      mensagem: 'Fila processada e pronta para envio',
      payload,
      quantidadeItens: itensPendentes.length,
    };
  } catch (erro) {
    console.error('[Sincronizador] Erro ao processar fila:', erro);
    return {
      sucesso: false,
      mensagem: erro.message,
      erros: 1,
    };
  }
}

// Expor globalmente para acesso via console/templates
window.sincronizador = {
  processarFilaSincronizacao,
};
