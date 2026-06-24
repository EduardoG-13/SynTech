/**
 * Interceptador de Requisições Offline
 * Monitora a conectividade e salva requisições falhas na fila sync_queue
 */

import { processarFilaSincronizacao } from '/public/js/sync.js';

let isOnline = navigator.onLine;

// Atualizar status quando mudar conectividade
window.addEventListener('online', () => {
  isOnline = true;
  console.log('[Offline Interceptor] Voltou online - iniciando sincronização');
  atualizarStatusBadge();
  sincronizarFilaPendente();
});

window.addEventListener('offline', () => {
  isOnline = false;
  console.log('[Offline Interceptor] Ficou offline - futuras requisições serão salvas localmente');
  atualizarStatusBadge();
});

/**
 * Fazer requisição com tratamento offline
 * Se falhar e estiver offline, salva na fila para sincronizar depois
 */
export async function fazerRequisicaoComOffline(url, opcoes = {}) {
  const { metodo = 'POST', dados = null, tipo = 'chamado' } = opcoes;

  try {
    const response = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...opcoes.headers,
      },
      body: dados ? JSON.stringify(dados) : null,
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }

    const resultado = await response.json();
    console.log('[Offline Interceptor] Requisição bem-sucedida', resultado);
    return { sucesso: true, dados: resultado };
  } catch (erro) {
    console.error('[Offline Interceptor] Erro na requisição:', erro);

    // Se estiver offline, salvar na fila
    if (!isOnline) {
      console.log('[Offline Interceptor] Dispositivo offline - salvando na fila local');
      try {
        const id = await salvarNaFila(tipo, {
          url,
          metodo,
          dados,
          tentativas: 0,
          ultimaTentativa: new Date().toISOString(),
        });

        return {
          sucesso: false,
          offline: true,
          mensagem: 'Operação salva localmente. Será sincronizada quando houver conexão.',
          idFila: id,
        };
      } catch (erroDb) {
        console.error('[Offline Interceptor] Erro ao salvar na fila:', erroDb);
        return {
          sucesso: false,
          offline: true,
          mensagem: 'Erro ao salvar localmente. Tente novamente.',
        };
      }
    }

    // Se estiver online, retornar erro
    return {
      sucesso: false,
      offline: false,
      mensagem: erro.message,
      erro: erro,
    };
  }
}

/**
 * Sincronizar fila de requisições pendentes
 */
export async function sincronizarFilaPendente() {
  if (!isOnline) {
    console.log('[Sincronização] Dispositivo offline - pulando sincronização');
    return;
  }

  try {
    console.log('[Sincronização] Iniciando sincronização em lote');
    const resultado = await processarFilaSincronizacao();

    if (resultado.sucesso) {
      console.log(
        `[Sincronização] Lote concluído - processados=${resultado.processados || 0}, sucessos=${resultado.sucessos || 0}, erros=${resultado.erros || 0}`
      );
    } else {
      console.warn('[Sincronização] Sincronização em lote não foi concluída', resultado.mensagem);
    }
  } catch (erro) {
    console.error('[Sincronização] Erro ao sincronizar fila pendente:', erro);
  }
}

/**
 * Salvar na fila (wrapper para salvarFila)
 */
async function salvarNaFila(tipo, dados) {
  return window.brpecIndexedDb.salvarFila(tipo, dados);
}

/**
 * Notifica a UI (pill de status no topo) que a conexão mudou.
 * O componente visual fica no footer (escuta 'brpec:conexao' + online/offline).
 */
function atualizarStatusBadge() {
  try {
    window.dispatchEvent(new CustomEvent('brpec:conexao', { detail: { online: isOnline } }));
  } catch (e) {
    /* CustomEvent indisponível: o pill ainda reage aos eventos nativos online/offline */
  }
}

/**
 * Verificar se está online
 */
export function estaOnline() {
  return isOnline;
}

/**
 * Forçar sincronização (pode ser chamado manualmente)
 */
export async function forcarSincronizacao() {
  if (isOnline) {
    await sincronizarFilaPendente();
  }
}

// Inicializar status ao carregar
window.addEventListener('load', () => {
  atualizarStatusBadge();

  // Se estiver online ao carregar, sincronizar automaticamente
  if (isOnline) {
    setTimeout(() => {
      sincronizarFilaPendente();
    }, 1000);
  }
});

// Expor globalmente para uso em templates
window.offlineInterceptor = {
  fazerRequisicaoComOffline,
  sincronizarFilaPendente,
  estaOnline,
  forcarSincronizacao,
  processarFilaSincronizacao,
};
