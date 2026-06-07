/**
 * Sincronizador de Lote - Processa registros offline
 * Lê todos os itens da fila e envia em lote para o servidor
 */

const MAX_ITEMS_POR_LOTE = 500;

function obterTipoEntidade(item) {
  const url = item.dados?.url;

  if (typeof url === 'string') {
    if (url.includes('/api/tarefas')) {
      return 'tarefa';
    }
    if (url.includes('/api/chamados')) {
      return 'alerta';
    }
    if (url.includes('/api/eventos-zootecnicos')) {
      return 'movimentacao';
    }
    if (url.includes('/evidencias')) {
      return 'evidencia';
    }
  }

  if (item.tipo === 'tarefa' || item.tipo === 'chamado') {
    return 'tarefa';
  }

  if (item.tipo === 'obito') {
    return 'movimentacao';
  }

  return 'tarefa';
}

function extrairDadosDoItem(item) {
  return item.dados?.dados ?? item.dados ?? null;
}

async function enviarLote(itensPendentes) {
  const itensParaEnviar = itensPendentes.map((item) => ({
    id: item.id,
    entidade_tipo: obterTipoEntidade(item),
    dados: extrairDadosDoItem(item),
  }));

  const response = await fetch('/api/sincronizacao/lote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ itens: itensParaEnviar }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha no envio do lote: ${response.status} ${errorText}`);
  }

  const resultado = await response.json();

  if (!resultado || !Array.isArray(resultado.resultados)) {
    throw new Error('Resposta inválida do servidor de sincronização em lote');
  }

  for (let index = 0; index < resultado.resultados.length; index += 1) {
    const resultadoItem = resultado.resultados[index];
    const registro = itensPendentes[index];

    if (resultadoItem.status === 'SINCRONIZADO') {
      await window.brpecIndexedDb.removerFila(registro.id);
    } else {
      registro.status = 'FALHA';
      registro.dados = {
        ...registro.dados,
        tentativas: (registro.dados?.tentativas || 0) + 1,
        ultimaTentativa: new Date().toISOString(),
        erroServidor: resultadoItem.erro || resultadoItem.status,
      };
      await window.brpecIndexedDb.atualizarFila(registro);
    }
  }

  return resultado;
}

/**
 * Processa a fila de sincronização
 * Lê todos os registros com status PENDENTE e envia para o servidor
 * @returns {Promise<Object>} Resultado da sincronização
 */
export async function processarFilaSincronizacao() {
  try {
    console.log('[Sincronizador] Iniciando processamento da fila...');

    if (!navigator.onLine) {
      console.warn('[Sincronizador] Dispositivo offline - aguardando conexão');
      return {
        sucesso: false,
        mensagem: 'Dispositivo offline. Aguarde reconexão.',
        offline: true,
      };
    }

    if (!window.brpecIndexedDb) {
      throw new Error('IndexedDB não está inicializado');
    }

    const itens = await window.brpecIndexedDb.listarFila();
    console.log(`[Sincronizador] Encontrados ${itens.length} itens na fila`);

    if (!itens || itens.length === 0) {
      return {
        sucesso: true,
        mensagem: 'Nenhum item para sincronizar',
        processados: 0,
        sucessos: 0,
        erros: 0,
      };
    }

    const itensPendentes = itens.filter((item) => item.status === 'PENDENTE');
    console.log(`[Sincronizador] ${itensPendentes.length} itens com status PENDENTE`);

    if (itensPendentes.length === 0) {
      return {
        sucesso: true,
        mensagem: 'Nenhum item pendente',
        processados: 0,
        sucessos: 0,
        erros: 0,
      };
    }

    let processados = 0;
    let sucessos = 0;
    let erros = 0;
    const resultados = [];

    for (let i = 0; i < itensPendentes.length; i += MAX_ITEMS_POR_LOTE) {
      const lote = itensPendentes.slice(i, i + MAX_ITEMS_POR_LOTE);
      console.log(`[Sincronizador] Enviando lote de ${lote.length} itens para /api/sincronizacao/lote`);

      const resultadoLote = await enviarLote(lote);
      processados += resultadoLote.processados || lote.length;
      sucessos += resultadoLote.sucessos || 0;
      erros += resultadoLote.erros || 0;
      resultados.push(...(resultadoLote.resultados || []));
    }

    console.log(
      `[Sincronizador] Sincronização concluída: processados=${processados}, sucessos=${sucessos}, erros=${erros}`
    );

    return {
      sucesso: true,
      mensagem: 'Sincronização em lote concluída',
      processados,
      sucessos,
      erros,
      resultados,
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
