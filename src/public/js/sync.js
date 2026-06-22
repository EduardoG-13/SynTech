/**
 * Sincronizador de Lote - Processa registros offline
 * Lê todos os itens da fila e envia em lote para o servidor
 */

const MAX_ITEMS_POR_LOTE = 500;
const MAX_TENTATIVAS_RETRY = 3;
const BACKOFF_BASE_MS = 1000;
const JITTER_MAX_MS = 500;
const SYNC_REQUEST_TIMEOUT_MS = Number(window.SYNC_REQUEST_TIMEOUT_MS || 5000);
const SYNC_EVIDENCE_TIMEOUT_MS = Number(window.SYNC_EVIDENCE_TIMEOUT_MS || 10000);

let syncInProgress = false;

const aguardar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function calcularAtrasoRetry(tentativa, jitter = Math.floor(Math.random() * JITTER_MAX_MS)) {
  const expoente = Math.max(tentativa - 1, 0);
  return BACKOFF_BASE_MS * (2 ** expoente) + jitter;
}

function criarErroRetryable(mensagem, retryable = true) {
  const erro = new Error(mensagem);
  erro.retryable = retryable;
  return erro;
}

async function fetchComTimeout(url, opcoes = {}, timeoutMs = SYNC_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...opcoes,
      signal: controller.signal,
    });
  } catch (erro) {
    if (erro && erro.name === 'AbortError') {
      throw criarErroRetryable('TIMEOUT');
    }

    throw criarErroRetryable(erro.message || 'Falha de comunicacao');
  } finally {
    clearTimeout(timeoutId);
  }
}

function deveRetentarStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

function payloadPossuiEvidencia(valor) {
  if (!valor || typeof valor !== 'object') {
    return false;
  }

  const camposDeMidia = ['fotoBase64', 'audioBase64', 'audio_base64', 'arquivo_base64'];

  for (const campo of camposDeMidia) {
    if (valor[campo]) {
      return true;
    }
  }

  return Object.values(valor).some((item) => payloadPossuiEvidencia(item));
}

export async function executarComRetry(operacao, opcoes = {}) {
  const maxTentativas = opcoes.maxTentativas || MAX_TENTATIVAS_RETRY;
  let ultimoErro;

  for (let tentativa = 1; tentativa <= maxTentativas; tentativa += 1) {
    try {
      return await operacao(tentativa);
    } catch (erro) {
      ultimoErro = erro;

      if (erro && erro.retryable === false) {
        throw erro;
      }

      if (tentativa >= maxTentativas) {
        break;
      }

      const atraso = calcularAtrasoRetry(tentativa);
      console.warn(
        `[Sincronizador] Falha de comunicacao na tentativa ${tentativa}/${maxTentativas}. Retentando em ${atraso}ms.`,
        erro
      );
      await aguardar(atraso);
    }
  }

  throw ultimoErro;
}

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

async function enviarLoteSemRetry(itensPendentes) {
  const itensParaEnviar = itensPendentes.map((item) => ({
    id: item.id,
    entidade_tipo: obterTipoEntidade(item),
    dados: extrairDadosDoItem(item),
  }));

  const timeoutMs = itensParaEnviar.some((item) => payloadPossuiEvidencia(item.dados))
    ? SYNC_EVIDENCE_TIMEOUT_MS
    : SYNC_REQUEST_TIMEOUT_MS;

  const response = await fetchComTimeout(
    '/api/sincronizacao/lote',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itens: itensParaEnviar }),
    },
    timeoutMs
  );

  // Exigir confirmação explícita (200 ou 201) antes de considerar os itens enviados
  if (response.status !== 200 && response.status !== 201) {
    const errorText = await response.text();
    throw criarErroRetryable(
      `Falha no envio do lote: ${response.status} ${errorText}`,
      deveRetentarStatus(response.status)
    );
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

async function enviarLote(itensPendentes) {
  return executarComRetry(() => enviarLoteSemRetry(itensPendentes));
}

/**
 * Processa a fila de sincronização
 * Lê todos os registros com status PENDENTE e envia para o servidor
 * @returns {Promise<Object>} Resultado da sincronização
 */
export async function processarFilaSincronizacao() {
  let syncLockAdquirido = false;

  try {
    console.log('[Sincronizador] Iniciando processamento da fila...');

    if (syncInProgress) {
      console.warn('[Sincronizador] Sincronização já em andamento - ignorando nova execução');
      return {
        sucesso: false,
        mensagem: 'Sincronização já em andamento',
        emAndamento: true,
      };
    }

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

    syncInProgress = true;
    syncLockAdquirido = true;

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

    const itensPendentes = itens.filter((item) => item.status === 'PENDENTE' || item.status === 'FALHA');
    console.log(`[Sincronizador] ${itensPendentes.length} itens com status PENDENTE ou FALHA`);

    if (itensPendentes.length === 0) {
      return {
        sucesso: true,
        mensagem: 'Nenhum item pendente ou com falha',
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
  } finally {
    if (syncLockAdquirido) {
      syncInProgress = false;
    }
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
