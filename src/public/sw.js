/* Service Worker BRPec — offline-first */
const CACHE_NAME = 'brpec-v23';

// 1) Assets estáticos: cacheados imediatamente na instalação do SW
const ASSETS_ESTATICOS = [
  '/',
  '/public/styles.css',
  '/public/app.js',
  '/public/js/icons.js',
  '/public/fonts/material-symbols-rounded-v2.woff2',
  '/public/js/db.js',
  '/public/js/sync.js',
  '/public/js/dashboard.js',
  '/public/js/configuracoes.js',
  '/public/js/chamados.js',
  '/public/js/audio-transcricao-local.js',
  '/public/js/novo-chamado-handler.js',
  '/public/js/chamado-resolver-handler.js',
  '/public/js/offline-interceptor.js',
  '/public/css/dashboard.css',
  '/public/css/tarefas.css',
  '/public/css/nova-os.css',
  '/public/css/boletas.css',
  '/public/css/configuracoes.css',
  '/public/css/infraestrutura.css',
  '/public/css/chamado.css',
  '/public/css/login.css',
  '/manifest.json',
  // Material Symbols é hospedado localmente; os ícones PWA são imagens reais.
  '/public/icons-pwa/icon-192.png',
  '/public/icons-pwa/icon-512.png',
  // Pictogramas ilustrativos mantidos nas escolhas de perfil e tipo de chamado.
  '/public/Icons/capataz.ico',
  '/public/Icons/infra.ico',
  '/public/Icons/coordenador.ico',
  '/public/Icons/gerente.ico',
  '/public/Icons/hidraulica.ico',
  '/public/Icons/eletrica.ico',
  '/public/Icons/cerca.ico',
  '/public/Icons/alerta.ico',
  '/public/Icons/nascimento.ico',
  '/public/Icons/obto.ico',
  '/public/Icons/movimentacao.ico',
  '/public/Icons/cedula_dinheiro_bovino.ico',
  '/public/Icons/evolucao.ico',
  '/public/Icons/tarefas.ico',
  // Logos da marca Syntech (sidebar branca + login verde)
  '/public/syntech-verde.png',
  '/public/syntech-branco.png',
];

// 2) Rotas autenticadas: pré-cacheadas DEPOIS do login (cliente avisa via postMessage)
// Por perfil — só baixa o que faz sentido pra quem está logado.
const ROTAS_POR_PERFIL = {
  Capataz:        ['/tarefas', '/nova-os', '/novo-chamado', '/sucesso',
                   '/api/dados/form-nova-os', '/api/boletas/minhas', '/api/historico/boletas?perfil_cache=Capataz',
                   '/api/tarefas',
                   '/api/historico/chamados?perfil_cache=Capataz', '/api/transferencias/pendentes'],
  Gerente:        ['/dashboard', '/configuracoes', '/infraestrutura', '/historico?perfil=Gerente',
                   '/nova-os', '/novo-chamado', '/sucesso', '/api/dados/form-nova-os',
                   '/api/dashboard/resumo', '/api/dashboard/retiros',
                   '/api/admin/retiros', '/api/admin/usuarios',
                   '/api/chamados', '/api/tarefas?status=ABERTA',
                   '/api/historico/boletas?perfil_cache=Gerente', '/api/historico/chamados?perfil_cache=Gerente'],
  Coordenador:    ['/dashboard', '/boletas', '/historico?perfil=Coordenador',
                   '/novo-chamado', '/sucesso',
                   '/api/dashboard/resumo', '/api/dashboard/retiros',
                   '/api/coordenador/boletas-pendentes',
                   '/api/historico/boletas?perfil_cache=Coordenador', '/api/historico/chamados?perfil_cache=Coordenador'],
  Infraestrutura: ['/infraestrutura', '/historico?perfil=Infraestrutura',
                   '/novo-chamado', '/sucesso',
                   '/api/chamados', '/api/historico/chamados?perfil_cache=Infraestrutura'],
};

async function buscarECachear(cache, url) {
  try {
    const req = new Request(url, { credentials: 'same-origin' });
    const res = await fetch(req);
    if (res && res.ok) {
      // Guarda com a URL informada para preservar queries quando elas existem.
      await cache.put(req, res.clone());
      return res;
    }
  } catch (e) {
    // offline ou erro: ignora
  }
  return null;
}

function extrairLista(json, chave) {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json[chave])) return json[chave];
  return [];
}

function adicionarId(set, valor) {
  if (valor === null || valor === undefined || valor === '') return;
  set.add(String(valor));
}

async function cachearBoletasRelacionadas(cache, listasJson) {
  const ids = new Set();
  Object.keys(listasJson).forEach((url) => {
    if (
      url !== '/api/boletas/minhas' &&
      url !== '/api/coordenador/boletas-pendentes' &&
      !url.startsWith('/api/historico/boletas')
    ) return;
    extrairLista(listasJson[url], 'boletas').forEach((b) => {
      adicionarId(ids, b.grupo_id || b.id);
      adicionarId(ids, b.id);
    });
  });

  await Promise.all(Array.from(ids).map(async (id) => {
    const encoded = encodeURIComponent(id);
    await buscarECachear(cache, `/boleta/${encoded}`);
    await buscarECachear(cache, `/api/boletas/${encoded}`);
    await buscarECachear(cache, `/api/coordenador/boleta/${encoded}/pdf`);
  }));
}

async function cachearTarefasRelacionadas(cache, listasJson) {
  const ids = new Set();
  [
    '/api/tarefas',
    '/api/tarefas?status=ABERTA'
  ].forEach((url) => {
    extrairLista(listasJson[url], 'tarefas').forEach((t) => adicionarId(ids, t.id));
  });

  await Promise.all(Array.from(ids).map(async (id) => {
    const encoded = encodeURIComponent(id);
    await buscarECachear(cache, `/tarefa/${encoded}`);
    await buscarECachear(cache, `/api/tarefas/${encoded}`);
  }));
}

async function cachearChamadosRelacionados(cache, listasJson, perfil) {
  const ids = new Set();
  Object.keys(listasJson).forEach((url) => {
    if (url !== '/api/chamados' && !url.startsWith('/api/historico/chamados')) return;
    extrairLista(listasJson[url], 'chamados').forEach((c) => adicionarId(ids, c.id));
  });

  await Promise.all(Array.from(ids).map(async (id) => {
    const encoded = encodeURIComponent(id);
    await buscarECachear(cache, `/chamado/${encoded}`);
    if (perfil === 'Infraestrutura' || perfil === 'Tecnico') {
      await buscarECachear(cache, `/chamado/${encoded}/resolver`);
    }
    await buscarECachear(cache, `/api/chamados/${encoded}`);
  }));
}

async function cachearTransferenciasRelacionadas(cache, listasJson) {
  const ids = new Set();
  extrairLista(listasJson['/api/transferencias/pendentes'], 'transferencias')
    .forEach((t) => adicionarId(ids, t.grupo_id));

  await Promise.all(Array.from(ids).map(async (id) => {
    const encoded = encodeURIComponent(id);
    await buscarECachear(cache, `/api/transferencias/${encoded}/detalhes`);
  }));
}

async function cachearRetirosRelacionados(cache, listasJson) {
  const ids = new Set();
  if (Array.isArray(listasJson['/api/dashboard/retiros'])) {
    listasJson['/api/dashboard/retiros'].forEach((r) => adicionarId(ids, r.id));
  }
  await Promise.all(Array.from(ids).map(async (id) => {
    const encoded = encodeURIComponent(id);
    await buscarECachear(cache, `/retiro/${encoded}`);
    await buscarECachear(cache, `/api/dashboard/retiros/${encoded}`);
  }));
}

async function cachearRotasRelacionadas(cache, perfil, listasJson) {
  await Promise.all([
    cachearBoletasRelacionadas(cache, listasJson),
    cachearTarefasRelacionadas(cache, listasJson),
    cachearChamadosRelacionados(cache, listasJson, perfil),
    cachearTransferenciasRelacionadas(cache, listasJson),
    cachearRetirosRelacionados(cache, listasJson),
  ]);
}

// ============ INSTALL: cacheia estáticos ============
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // addAll falha tudo se um arquivo der erro — mais robusto adicionar individualmente
      Promise.all(ASSETS_ESTATICOS.map((url) =>
        cache.add(url).catch((err) => console.warn('[SW] falha ao cachear', url, err))
      ))
    )
  );
  self.skipWaiting();
});

// ============ ACTIVATE: limpa caches antigos ============
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ============ MENSAGEM DO CLIENTE: pré-cache pós-login ============
self.addEventListener('message', (event) => {
  if (!event.data || event.data.tipo !== 'pre-cache-perfil') return;
  const perfil = event.data.perfil;
  const rotas = ROTAS_POR_PERFIL[perfil] || [];
  if (!rotas.length) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const listasJson = {};
    await Promise.all(rotas.map(async (url) => {
      const res = await buscarECachear(cache, url);
      if (res && url.startsWith('/api/')) {
        try {
          listasJson[url] = await res.clone().json();
        } catch (e) {
          // resposta nao-JSON: ignora
        }
      }
    }));
    await cachearRotasRelacionadas(cache, perfil, listasJson);
    console.log('[SW] Pré-cache concluído para perfil', perfil);
  })());
});

// ============ FETCH: network-first + fallback do cache ============
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Não cacheamos cross-origin (CDNs externas etc)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cacheia respostas OK para uso offline futuro
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(async () => {
        const exata = await caches.match(event.request);
        if (exata) return exata;
        return caches.match(event.request, { ignoreSearch: true });
      })
  );
});
