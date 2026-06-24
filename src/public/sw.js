/* Service Worker BRPec — offline-first */
const CACHE_NAME = 'brpec-v17';

// 1) Assets estáticos: cacheados imediatamente na instalação do SW
const ASSETS_ESTATICOS = [
  '/',
  '/public/styles.css',
  '/public/app.js',
  '/public/js/db.js',
  '/public/js/sync.js',
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
  // Logos da marca Syntech (sidebar branca + login verde)
  '/public/syntech-verde.png',
  '/public/syntech-branco.png',
  // Ícones temáticos usados na nova-os, detalhe-boleta, chamados
  '/public/Icons/Brinco.ico',
  '/public/Icons/GPS.ico',
  '/public/Icons/Pasto.ico',
  '/public/Icons/Placa_de_carro.ico',
  '/public/Icons/abaco_calculo_total.ico',
  '/public/Icons/acesso_restrito.ico',
  '/public/Icons/aperto_maos_acordo.ico',
  '/public/Icons/bloqueado.ico',
  '/public/Icons/bussola_direcao_guia.ico',
  '/public/Icons/calendario_pagina_agenda.ico',
  '/public/Icons/caminhao_transporte_gado.ico',
  '/public/Icons/carrinho_compras_gado.ico',
  '/public/Icons/cedula_dinheiro_bovino.ico',
  '/public/Icons/comitiva_peao_a_cavalo.ico',
  '/public/Icons/dashboard_analise_dados.ico',
  '/public/Icons/destido.ico',
  '/public/Icons/editar.ico',
  '/public/Icons/entrada_animais_recebimento_compra.ico',
  '/public/Icons/envio_animais_caixa.ico',
  '/public/Icons/evolucao.ico',
  '/public/Icons/excluir.ico',
  '/public/Icons/exit.ico',
  '/public/Icons/historico_tempo_voltar.ico',
  '/public/Icons/identidade.ico',
  '/public/Icons/instalar_aplicativo_celular.ico',
  '/public/Icons/lupa.ico',
  '/public/Icons/olho_senha_aberto.ico',
  '/public/Icons/olho_senha_fechado.ico',
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
