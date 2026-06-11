/* Service Worker BRPec — offline-first */
const CACHE_NAME = 'brpec-v4';

// 1) Assets estáticos: cacheados imediatamente na instalação do SW
const ASSETS_ESTATICOS = [
  '/',
  '/public/styles.css',
  '/public/app.js',
  '/public/js/db.js',
  '/public/js/dashboard.js',
  '/public/js/configuracoes.js',
  '/public/js/chamados.js',
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
  // Icones
  '/public/Icons/alerta.ico',
  '/public/Icons/andamento.ico',
  '/public/Icons/bebedouro.ico',
  '/public/Icons/capataz.ico',
  '/public/Icons/cerca.ico',
  '/public/Icons/cerca_eletrica.ico',
  '/public/Icons/cerca_quebrada.ico',
  '/public/Icons/concluido.ico',
  '/public/Icons/configuracao.ico',
  '/public/Icons/coordenador.ico',
  '/public/Icons/eletrica.ico',
  '/public/Icons/gerente.ico',
  '/public/Icons/grava_audio.ico',
  '/public/Icons/hidraulica.ico',
  '/public/Icons/home.ico',
  '/public/Icons/infra.ico',
  '/public/Icons/iniciar_task.ico',
  '/public/Icons/localizacao.ico',
  '/public/Icons/movimentacao.ico',
  '/public/Icons/nascimento.ico',
  '/public/Icons/obto.ico',
  '/public/Icons/offline.ico',
  '/public/Icons/pendente.ico',
  '/public/Icons/salvar.ico',
  '/public/Icons/sincronizacao.ico',
  '/public/Icons/tarefas.ico',
  '/public/Icons/tira_foto.ico',
  '/public/icons-pwa/icon-192.png',
  '/public/icons-pwa/icon-512.png',
];

// 2) Rotas autenticadas: pré-cacheadas DEPOIS do login (cliente avisa via postMessage)
// Por perfil — só baixa o que faz sentido pra quem está logado.
const ROTAS_POR_PERFIL = {
  Capataz:        ['/tarefas', '/nova-os', '/historico', '/novo-chamado', '/sucesso',
                   '/api/dados/form-nova-os', '/api/boletas/minhas', '/api/historico/boletas'],
  Gerente:        ['/dashboard', '/configuracoes', '/infraestrutura', '/historico',
                   '/api/dashboard/resumo', '/api/dashboard/retiros',
                   '/api/admin/retiros', '/api/admin/usuarios',
                   '/api/historico/boletas', '/api/historico/chamados'],
  Coordenador:    ['/dashboard', '/boletas', '/historico',
                   '/api/dashboard/resumo', '/api/dashboard/retiros',
                   '/api/coordenador/boletas-pendentes',
                   '/api/historico/boletas', '/api/historico/chamados'],
  Infraestrutura: ['/infraestrutura', '/historico',
                   '/api/chamados', '/api/historico/chamados'],
};

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
    await Promise.all(rotas.map(async (url) => {
      try {
        const res = await fetch(url, { credentials: 'same-origin' });
        if (res && res.ok) await cache.put(url, res.clone());
      } catch (e) {
        // offline ou erro: ignora
      }
    }));
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
      .catch(() => caches.match(event.request))
  );
});
