# SP5 - Estrategias de resiliencia para sincronizacao offline-online

## Contexto

O fluxo offline-online do BrPec atende os requisitos RF010, RF011 e RF012 em um ambiente com janelas curtas de conectividade Starlink nos retiros. A prioridade de confiabilidade e evitar perda de dados durante falhas de conexao. Por isso, a estrategia escolhida combina persistencia local, retry controlado, timeout explicito e fallback para leitura/operacao local.

## Rastreabilidade

| Item | Relacao com a estrategia |
| --- | --- |
| US08 | Capataz registra operacoes offline e mantem continuidade no campo. |
| US09 | Dados pendentes sao sincronizados quando houver conexao disponivel. |
| RF010 | Deteccao de reconexao dispara sincronizacao automatica. |
| RF011 | UI recebe confirmacao/estado de sincronizacao apos envio bem-sucedido. |
| RF012 | Registros com falha permanecem salvos localmente e sao reenviados. |
| RN08 | Conclusao de tarefa offline fica persistida ate a sincronizacao. |
| RN21 | Alertas sem conexao sao armazenados localmente e enviados depois. |
| RNF:CONF | Nao remover dados locais sem confirmacao explicita do backend. |

## Pontos criticos de falha

| Ponto | Risco | Mitigacao definida |
| --- | --- | --- |
| Submissao de formularios em campo | Perda do registro quando a rede cai durante o envio. | Fallback local no IndexedDB antes de informar sucesso offline ao usuario. |
| Reconexao instavel | Varias tentativas simultaneas ou falhas repetidas consumindo a janela Starlink. | Retry com backoff exponencial, limite de tentativas por ciclo e trava de sincronizacao em andamento. |
| Endpoint `/api/sincronizacao/lote` lento ou indisponivel | Tela travada e fila sem evolucao. | Timeout configuravel no cliente e manutencao do item na fila em caso de timeout. |
| Processamento parcial do lote | Remover localmente itens que nao foram gravados no backend. | Remover apenas itens com status `SINCRONIZADO` retornado pelo backend. |
| Cache offline de telas e dados de apoio | Usuario sem acesso as telas principais quando sem internet. | Service Worker com `network-first` para GET e fallback de cache. |
| Payload grande com evidencias | Falha de envio em conexao curta. | Lote limitado a 500 itens e retry por ciclo; evidencias seguem preservadas no IndexedDB ate confirmacao. |

## Estrategias selecionadas

### 1. Fallback local obrigatorio

Camada: frontend/PWA, em `src/public/js/offline-interceptor.js`, `src/public/js/db.js` e handlers de formularios.

Decisao:
- Toda operacao mutavel feita sem conexao, ou que falhe por indisponibilidade de rede, deve ser salva em `sync_queue` no IndexedDB com status `PENDENTE`.
- O usuario deve receber feedback de que o registro foi salvo localmente, nao de que ja foi sincronizado.
- O registro local so pode ser removido quando o backend retornar confirmacao individual `SINCRONIZADO`.

Parametros:
- Tipos aceitos na fila local: `tarefa`, `chamado`, `obito`, `nascimento`.
- Status inicial: `PENDENTE`.
- Metadados minimos: `url`, `metodo`, `dados`, `tentativas`, `ultimaTentativa`.
- Remocao local: somente apos HTTP `200` ou `201` do lote e resultado individual `SINCRONIZADO`.

### 2. Retry com backoff exponencial

Camada: frontend/PWA, no sincronizador de fila (`src/public/js/sync.js`) e no interceptador de reconexao.

Decisao:
- Cada item pendente deve ser reenviado automaticamente ao evento `online` e tambem quando o usuario acionar sincronizacao manual.
- Falhas temporarias devem reagendar o item com atraso progressivo.
- Falhas de validacao retornadas pelo backend devem permanecer visiveis como `FALHA`, sem apagar o registro local.

Parametros implementados em `src/public/js/sync.js`:
- Tentativas automaticas por ciclo de conectividade: maximo de 3.
- Backoff exponencial: 1s, 2s e 4s.
- Jitter: ate 500ms por tentativa para evitar rajadas quando varias abas/dispositivos reconectarem juntos.
- Apos 3 falhas no mesmo ciclo: manter item na fila com status `PENDENTE` ou `FALHA` e tentar novamente apenas no proximo evento `online` ou sincronizacao manual.
- Concorrencia: 1 lote por vez no navegador, com flag `syncInProgress`.

### 3. Timeout configuravel

Camada: frontend/PWA para chamadas de sincronizacao, operacoes mutaveis com fallback local e autenticacao; backend apenas respeita limite de payload e retorna status claro.

Decisao:
- Chamadas de sincronizacao devem usar `AbortController` para nao ficarem indefinidamente abertas em conexoes instaveis.
- Timeout deve ser parametrizado para permitir ajuste por ambiente sem alterar o fluxo de negocio.

- Parametros implementados em `src/public/js/sync.js`, `src/public/js/offline-interceptor.js` e `src/public/js/auth-client.js`:
- Timeout padrao para envio de lote, operacoes mutaveis e auth: 5s.
- Timeout para operacoes com evidencia em Base64: 10s quando o payload individual tiver midia.
- Variaveis/configuracoes suportadas: `SYNC_REQUEST_TIMEOUT_MS`, `SYNC_EVIDENCE_TIMEOUT_MS`, `CRITICAL_REQUEST_TIMEOUT_MS`, `CRITICAL_EVIDENCE_REQUEST_TIMEOUT_MS` e `AUTH_REQUEST_TIMEOUT_MS`.
- Em timeout: nao remover item da fila; incrementar `tentativas`, registrar `ultimaTentativa` e `erroServidor = "TIMEOUT"`.
- Em timeout de operacao mutavel via `fazerRequisicaoComOffline`: salvar automaticamente no IndexedDB e retornar confirmacao de armazenamento local ao usuario.

### 4. Fallback de cache para leitura

Camada: Service Worker (`src/public/sw.js`).

Decisao:
- Requisicoes `GET` same-origin continuam com estrategia `network-first` e fallback para cache.
- Requisicoes mutaveis (`POST`, `PUT`, `PATCH`, `DELETE`) nao devem ser cacheadas pelo Service Worker; devem ser tratadas pela fila local do PWA.

Parametros:
- Cache atual: `brpec-v4`.
- Pre-cache minimo: assets estaticos, scripts offline, estilos e icones PWA.
- Pre-cache por perfil apos login: rotas e dados de apoio relevantes para Capataz, Gerente, Coordenador e Infraestrutura.

### 5. Processamento defensivo no backend

Camada: backend, em `src/backend/controllers/sincronizacaoController.ts` e `src/backend/services/sincronizacaoService.ts`.

Decisao:
- O endpoint `/api/sincronizacao/lote` deve continuar processando cada item individualmente para permitir sucesso parcial sem bloquear o lote inteiro.
- O backend deve devolver `resultados[]` com status por item para o cliente decidir quais registros remover.
- O limite de lote evita payloads grandes demais em janelas curtas de conexao.

Parametros:
- Endpoint: `POST /api/sincronizacao/lote`.
- Limite por lote: 500 itens.
- Status de sucesso individual: `SINCRONIZADO`.
- Status de falha individual: `ERRO`, com mensagem em `erro`.
- HTTP esperado para lote aceito: `200`.
- HTTP para lote invalido: `400`.
- HTTP para lote acima do limite: `413`.

## Fluxo operacional definido

1. Usuario executa uma operacao no PWA.
2. Se houver conexao, o frontend tenta enviar a requisicao.
3. Se a requisicao falhar por offline, timeout ou erro de rede, o registro e salvo no IndexedDB.
4. Ao detectar `online`, o sincronizador seleciona itens `PENDENTE` e envia lotes de ate 500 registros.
5. O backend processa cada item e retorna resultado individual.
6. O cliente remove apenas os itens confirmados como `SINCRONIZADO`.
7. Itens com `ERRO`, timeout ou falha de rede permanecem locais para nova tentativa.
8. A UI atualiza o estado de sincronizacao e informa sucesso ou pendencia ao usuario.

## Criterios tecnicos para a implementacao

- Nao apagar registros locais sem confirmacao individual do backend.
- Nao bloquear a UI enquanto a sincronizacao ocorre.
- Evitar multiplas sincronizacoes simultaneas no mesmo cliente.
- Registrar tentativas e ultima tentativa para auditoria e depuracao.
- Manter compatibilidade com os testes existentes de offline e sincronizacao.
- Manter testes unitarios/integracao para timeout, retry maximo e manutencao de item falho na fila.

## Resumo para o issue

Foram implementadas tres estrategias principais de resiliencia no fluxo offline-online: fallback local obrigatorio no PWA via IndexedDB, retry com backoff exponencial no sincronizador de fila e timeout configuravel nas chamadas criticas de sincronizacao, operacoes mutaveis e autenticacao. O Service Worker fica responsavel apenas por fallback de leitura/cache para requisicoes `GET`, enquanto operacoes mutaveis seguem pela fila local. No backend, o endpoint `/api/sincronizacao/lote` mantem processamento item a item, limite de 500 itens por lote e resposta com status individual, permitindo remover localmente apenas o que retornar `SINCRONIZADO`.

Parametros definidos: maximo de 3 retries por ciclo, backoff de 1s/2s/4s com jitter ate 500ms, timeout padrao de 5s para envio de lote, operacoes mutaveis e auth, timeout de 10s para payloads com evidencia, lote maximo de 500 itens e remocao local somente apos confirmacao individual do backend.
