const CACHE_NAME = 'brpec-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/public/styles.css',
  '/public/css/dashboard.css',
  '/public/app.js',
  '/public/js/db.js',
  '/public/js/dashboard.js',
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
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
