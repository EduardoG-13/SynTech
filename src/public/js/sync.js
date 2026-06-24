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

// Boletas são polimórficas (N movimentações + numero_boleta/grupo_id gerados no
// servidor), então NÃO cabem no /lote genérico: reenviamos a requisição ORIGINAL
// (POST/PUT em /api/boletas), que já executa toda a lógica de criação/edição.
function ehReplayDireto(item) {
  const url = item?.dados?.url;
  return typeof url === 'string' && url.includes('/api/boletas');
}

async function replayItemDireto(item) {
  const url = item.dados.url;
  const metodo = item.dados.metodo || 'POST';
  const corpo = extrairDadosDoItem(item);

  const resp = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: corpo ? JSON.stringify(corpo) : null,
  });

  if (resp.status >= 200 && resp.status < 300) {
    try {
      await window.brpecIndexedDb.removerVarios([item.id]);
    } catch (e) {
      console.error('[Sincronizador] Falha ao remover boleta sincronizada localmente:', e);
    }
    return true;
  }

  // Mantém PENDENTE para nova tentativa na próxima conexão; apenas registra a tentativa.
  try {
    item.dados = {
      ...item.dados,
      tentativas: (item.dados.tentativas || 0) + 1,
      ultimaTentativa: new Date().toISOString(),
      erroServidor: `HTTP ${resp.status}`,
    };
    await window.brpecIndexedDb.atualizarFila(item);
  } catch (e) {
    console.error('[Sincronizador] Falha ao registrar tentativa de boleta:', e);
  }
  return false;
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

  // Exigir confirmação explícita (200 ou 201) antes de considerar os itens enviados
  if (response.status !== 200 && response.status !== 201) {
    const errorText = await response.text();
    throw new Error(`Falha no envio do lote: ${response.status} ${errorText}`);
  }

  const resultado = await response.json();

  if (!resultado || !Array.isArray(resultado.resultados)) {
    throw new Error('Resposta inválida do servidor de sincronização em lote');
  }

  // Coletar IDs sincronizados e atualizar os demais em lote
  const idsParaRemover = [];
  const updates = [];

  for (let index = 0; index < resultado.resultados.length; index += 1) {
    const resultadoItem = resultado.resultados[index];
    const registro = itensPendentes[index];

    if (resultadoItem.status === 'SINCRONIZADO') {
      idsParaRemover.push(registro.id);
    } else {
      registro.status = 'FALHA';
      registro.dados = {
        ...registro.dados,
        tentativas: (registro.dados?.tentativas || 0) + 1,
        ultimaTentativa: new Date().toISOString(),
        erroServidor: resultadoItem.erro || resultadoItem.status,
      };
      updates.push(registro);
    }
  }

  // Remover em transação única os IDs confirmados pelo servidor
  if (idsParaRemover.length > 0) {
    try {
      await window.brpecIndexedDb.removerVarios(idsParaRemover);
    } catch (e) {
      console.error('[Sincronizador] Falha ao remover registros sincronizados localmente:', e);
      // Caso a remoção falhe, não interrompemos o fluxo — os itens podem ser removidos
      // na próxima sincronização quando a transação funcionar corretamente.
    }
  }

  // Atualizar registros com falha individualmente
  for (const registro of updates) {
    try {
      await window.brpecIndexedDb.atualizarFila(registro);
    } catch (e) {
      console.error('[Sincronizador] Falha ao atualizar registro com erro de sincronização:', e);
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

    // 1) Replay direto: boletas reenviam a requisição original ao /api/boletas
    const itensReplay = itensPendentes.filter(ehReplayDireto);
    const itensLote = itensPendentes.filter((item) => !ehReplayDireto(item));

    for (const item of itensReplay) {
      processados += 1;
      try {
        const ok = await replayItemDireto(item);
        if (ok) sucessos += 1; else erros += 1;
      } catch (e) {
        erros += 1;
        console.error('[Sincronizador] Erro ao reenviar boleta offline:', e);
      }
    }

    // 2) Lote genérico: tarefas, chamados/alertas, movimentações, evidências
    for (let i = 0; i < itensLote.length; i += MAX_ITEMS_POR_LOTE) {
      const lote = itensLote.slice(i, i + MAX_ITEMS_POR_LOTE);
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

    // Avisa a UI (pill de status no topo) para recontar a fila
    try {
      window.dispatchEvent(new CustomEvent('brpec:sincronizacaoConcluida', {
        detail: { processados, sucessos, erros },
      }));
    } catch (e) { /* ambiente sem window/CustomEvent */ }

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

// Ao detectar que o navegador voltou a ficar online, tentar processar a fila
// e notificar a UI para atualizar o status. Parte 2 (remoção em transação)
// será implementada posteriormente.
window.addEventListener('online', async () => {
  console.log('[Sincronizador] Evento online detectado. Iniciando sincronização automática.');

  try {
    const resultado = await processarFilaSincronizacao();

    if (resultado && resultado.sucesso) {
      try {
        // Dispara evento de aplicativo para que qualquer listener na UI atualize o status
        window.dispatchEvent(new CustomEvent('brpec:sincronizacaoConcluida', { detail: resultado }));
      } catch (e) {
        // ignore
      }

      try {
        // sinal simples para UI legada que não escuta o evento
        localStorage.setItem('brpec_last_sync_status', 'Sincronizado');
      } catch (e) {
        // ignore
      }

      console.log('[Sincronizador] Sincronização automática concluída.');
    } else {
      console.warn('[Sincronizador] Sincronização automática não processou itens ou falhou.', resultado);
    }
  } catch (erro) {
    console.error('[Sincronizador] Erro ao executar sincronização automática:', erro);
  }
});
