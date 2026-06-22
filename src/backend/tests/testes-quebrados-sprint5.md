## Inventário de Testes Quebrados — Sprint 5

### Resumo Executivo

| Status | Suites | Casos de Teste |
|--------|--------|----------------|
| Quebrados (suite falhou) | 13 | ~116 bloqueados |
| Passando | 13 | 80 |
| **Total** | **26** | **~196** |

**50% da suite está inoperante.** Duas causas raiz distintas, ambas de dependência ausente. O total passou de 24 para 26 suites após adição de `critical-timeout.test.ts` e `sync-retry.test.ts` ao projeto.

### Suites passando

| Suite | Casos |
|-------|-------|
| `src/backend/tests/unit/healthService.test.ts` | 4 |
| `src/backend/tests/unit/exportacaoService.test.ts` | 4 |
| `src/backend/tests/unit/obitoService.test.ts` | 4 |
| `src/backend/tests/unit/nascimentoService.test.ts` | 2 |
| `src/backend/tests/unit/eventoService.test.ts` | 4 |
| `src/backend/tests/unit/alertaService.test.ts` | 8 |
| `src/backend/tests/unit/database.test.ts` | 4 |
| `src/backend/tests/unit/tarefaService.test.ts` | 13 |
| `src/backend/tests/unit/cloudSyncService.test.ts` | 15 |
| `src/backend/tests/initDb.test.ts` | 16 |
| `src/backend/tests/swagger.test.ts` | 1 |
| `src/backend/tests/critical-timeout.test.ts` | 2 |
| `src/backend/tests/sync-retry.test.ts` | 3 |

---

## CAUSA RAIZ 1 — `cookie-parser` não instalado

**Erro:** `TS2307: Cannot find module 'cookie-parser' or its corresponding type declarations` em `src/backend/app.ts:6`

**Impacto: CRÍTICO** — Derruba 12 suites de integração inteiras. Nenhum teste de endpoint, autenticação, sincronização ou offline executa.

### Suites afetadas e seus casos

---

#### 1. `src/backend/tests/alertaIntegration.test.ts` — 5 casos | CRÍTICO
Cobre RF006 (criação de alertas com GPS).

| Caso | Impacto |
|------|---------|
| `201 — cria chamado com payload válido completo (RF006)` | Crítico |
| `201 — alerta retornado contém campos obrigatórios` | Crítico |
| `400 — payload vazio: sem tipo, descrição nem coordenadas (RN06)` | Crítico |
| `400 — sem capataz_id` | Médio |
| `400 — sem coordenadas GPS (RN06)` | Crítico |

---

#### 2. `src/backend/tests/auth-jwt.test.ts` — 4 casos | CRÍTICO
Cobre o fluxo completo de autenticação JWT (login, refresh, proteção de rotas).

| Caso | Impacto |
|------|---------|
| `login retorna access token e define refresh token em cookie httpOnly` | Crítico |
| `refresh emite novo access token quando o refresh token é válido` | Crítico |
| `rota protegida rejeita requisição sem access token` | Crítico |
| `rota protegida aceita access token válido` | Crítico |

---

#### 3. `src/backend/tests/contratos-rnf.test.ts` — 9 casos | CRÍTICO
Cobre RNF02, RNF03, RNF05, RNF-CAP, RN28, fluxo do técnico de infraestrutura.

| Caso | Impacto |
|------|---------|
| `exporta apenas movimentações com validado = 1 (RN28)` | Crítico |
| `impede exportação por perfil diferente de Coordenador (RN28)` | Crítico |
| `rejeita status fora do contrato no banco (RNF05)` | Médio |
| `processa lote heterogêneo e registra resultados (RNF03)` | Crítico |
| `rejeita lote acima do limite de 500 itens (RNF-CAP)` | Crítico |
| `lista tarefas do dia em até 2 segundos com 1.000 tarefas (RNF02)` | Crítico |
| `lista chamados para o painel da equipe de infraestrutura` | Médio |
| `técnico resolve chamado com descrição e foto de evidência` | Crítico |
| `impede resolução por usuário que não seja técnico` | Crítico |

---

#### 4. `src/backend/tests/endpoints.test.ts` — 16 casos | CRÍTICO
Suite de fumaça dos endpoints principais; cobre RF001, RF006, RF008.

| Caso | Impacto |
|------|---------|
| `GET /api/health — retorna 200 com status do sistema` | Médio |
| `POST /api/tarefas — 201 cria tarefa com dados válidos` | Crítico |
| `POST /api/tarefas — 400 campos obrigatórios ausentes` | Médio |
| `POST /api/tarefas — 422 capataz não pertence ao retiro (RN01)` | Crítico |
| `GET /api/tarefas/hoje — 200 retorna lista do capataz` | Crítico |
| `GET /api/tarefas/hoje — 400 capataz_id ausente` | Médio |
| `PATCH /api/tarefas/:id/concluir — 200 conclui tarefa` | Crítico |
| `PATCH /api/tarefas/:id/concluir — 400 capataz_id ausente` | Médio |
| `PATCH /api/tarefas/:id/concluir — 404 tarefa não encontrada` | Médio |
| `POST /api/tarefas/:id/evidencias — 201 anexa evidência` | Crítico |
| `POST /api/tarefas/:id/evidencias — 400 campos ausentes` | Médio |
| `POST /api/tarefas/:id/evidencias — 404 tarefa inexistente` | Médio |
| `POST /api/chamados — 201 cria chamado com dados válidos` | Crítico |
| `POST /api/chamados — 400 campos obrigatórios ausentes` | Médio |
| `POST /api/eventos-zootecnicos/nascimentos — 201 registra nascimento` | Crítico |
| `POST /api/eventos-zootecnicos/nascimentos — 400 campos ausentes` | Médio |

---

#### 5. `src/backend/tests/eventoIntegration.test.ts` — 18 casos | CRÍTICO
Cobre RF008 (nascimentos), RF009/RN07 (óbitos com foto obrigatória), RF013.

| Caso | Impacto |
|------|---------|
| `POST /nascimentos — 201 cria nascimento com payload válido (RF008)` | Crítico |
| `POST /nascimentos — 201 registro retornado contém campos obrigatórios` | Médio |
| `POST /nascimentos — 400 payload vazio` | Médio |
| `POST /nascimentos — 400 sem data` | Médio |
| `POST /nascimentos — 400 sem retiro_id` | Médio |
| `POST /nascimentos — 400 sem categoria` | Médio |
| `POST /nascimentos — 400 sem quantidade` | Médio |
| `POST /nascimentos — 400 sem capataz_id` | Médio |
| `POST /obitos — 201 cria óbito com payload válido (RF009, RN07)` | Crítico |
| `POST /obitos — 201 registro retornado contém movimentacao_id e obito_id` | Médio |
| `POST /obitos — 422 sem foto_base64: evidência obrigatória (RN07)` | Crítico |
| `POST /obitos — 400 payload vazio` | Médio |
| `POST /obitos — 422 sem identificacao_animal (RF013)` | Crítico |
| `POST /obitos — 422 sem causa_morte (RF013)` | Crítico |
| `POST /obitos — 400 sem data (RF013)` | Médio |
| `foto Base64 é persistida na tabela evidencias (RN07)` | Crítico |
| `movimentação é registrada no inventário com quantidade e categoria` | Crítico |
| `registro de óbito vincula movimentação, foto e causa_morte` | Crítico |

---

#### 6. `src/backend/tests/frontend.test.ts` — 3 casos | MÉDIO
Valida o setup de IndexedDB/offline no front-end.

| Caso | Impacto |
|------|---------|
| `renderiza a página inicial com o script do IndexedDB` | Médio |
| `serve o script que inicializa o banco local brpec_local` | Médio |
| `serve a função salvarFila para registrar operações offline pendentes` | Médio |

---

#### 7. `src/backend/tests/offline-operations.test.ts` — 11 casos | CRÍTICO
Cobre a estratégia offline completa (interceptador, handlers, sync.js, db.js, fila).

| Caso | Impacto |
|------|---------|
| `serve o script de interceptação offline` | Crítico |
| `serve o handler para nova-os` | Crítico |
| `serve o handler para resolver chamado` | Crítico |
| `serve o script sync.js para sincronização em lote` | Crítico |
| `o template EJS de novo-chamado carrega o handler offline correto` | Médio |
| `o handler offline do chamado expõe o caminho da API` | Médio |
| `db.js possui todas as funções necessárias` | Crítico |
| `footer.ejs carrega os scripts de offline e db` | Baixo |
| `POST com offline salva na fila ao invés de enviar` | Crítico |
| `PUT para resolver chamado com offline salva na fila` | Crítico |
| `endpoint POST /api/sincronizacao/lote existe para processar fila` | Crítico |

---

#### 8. `src/backend/tests/outros-endpoints.test.ts` — 6 casos | CRÍTICO
Suite complementar de endpoints (health, alertas, nascimentos).

| Caso | Impacto |
|------|---------|
| `HE1. GET /api/health — retorna 200 com informações de saúde` | Médio |
| `AL1. POST /api/chamados — cria alerta com dados válidos (HTTP 201)` | Crítico |
| `AL2. POST /api/chamados — campos obrigatórios ausentes (HTTP 400)` | Médio |
| `N1. POST /nascimentos — registra nascimento animal (HTTP 201)` | Crítico |
| `N2. POST /nascimentos — campos obrigatórios ausentes (HTTP 400)` | Médio |
| `N3. POST /nascimentos — data de nascimento futura (RN27)` | Crítico |

---

#### 9. `src/backend/tests/sincronizacaoIntegration.test.ts` — 12 casos | CRÍTICO
Cobre RF011 (sincronização em lote), RF007 (painel gerencial), RNF-CAP.

| Caso | Impacto |
|------|---------|
| `200 — processa lote misto e retorna totais corretos (RF011)` | Crítico |
| `200 — cada resultado contém entidade_tipo e status (RF011)` | Crítico |
| `200 — item com dados inválidos gera status ERRO sem derrubar o lote` | Crítico |
| `400 — sem campo itens no body` | Médio |
| `400 — itens não é array` | Médio |
| `400 — array de itens vazio` | Médio |
| `413 — lote com mais de 500 itens excede limite (RNF-CAP)` | Crítico |
| `200 — retorna estrutura completa do painel (RF007)` | Crítico |
| `200 — resumo_tarefas reflete as 4 tarefas inseridas` | Crítico |
| `200 — tarefas_por_retiro contém o retiro com tarefas inseridas` | Crítico |
| `400 — sem gerente_id na query string` | Médio |
| `403 — gerente_id pertence a perfil Capataz (ACESSO_NEGADO)` | Crítico |

---

#### 10. `src/backend/tests/tarefaIntegration.test.ts` — 7 casos | CRÍTICO
Cobre RF001 (gestão de tarefas), RN03 (isolamento por capataz).

| Caso | Impacto |
|------|---------|
| `GET /hoje — 200 retorna body com tarefas e campo modo` | Crítico |
| `GET /hoje — 200 cada tarefa contém os campos obrigatórios` | Médio |
| `GET /hoje — 200 retorna apenas tarefas do capataz logado (RN03)` | Crítico |
| `GET /hoje — 400 capataz_id ausente na query` | Médio |
| `PATCH /concluir — 200 altera status para CONCLUIDA no banco` | Crítico |
| `PATCH /concluir — 400 capataz_id ausente no body` | Médio |
| `PATCH /concluir — 404 tarefa inexistente` | Médio |

---

#### 11. `src/backend/tests/uc01-planejar-tarefas.test.ts` — 15 casos | CRÍTICO
Suite primária da US01/RF001. Cobre criação, listagem, conclusão e evidências de tarefas.

| Caso | Impacto |
|------|---------|
| `C1. POST /tarefas — sucesso HTTP 201` | Crítico |
| `C2. POST /tarefas — capataz não pertence ao retiro (HTTP 422, RN01)` | Crítico |
| `C3. POST /tarefas — campos obrigatórios ausentes (HTTP 400)` | Médio |
| `C4. POST /tarefas — persistência com todos os campos corretos` | Crítico |
| `H1. GET /hoje — retorna tarefa do dia (HTTP 200)` | Crítico |
| `H2. GET /hoje — retorna array vazio quando sem tarefas hoje` | Médio |
| `H3. GET /hoje — capataz_id ausente (HTTP 400)` | Médio |
| `K1. PATCH /concluir — conclui tarefa, retorna CONCLUIDA (HTTP 200)` | Crítico |
| `K2. PATCH /concluir — tarefa não pertence ao capataz (HTTP 404)` | Crítico |
| `K3. PATCH /concluir — status e concluida_em atualizados no banco` | Crítico |
| `K4. PATCH /concluir — capataz_id ausente (HTTP 400)` | Médio |
| `E1. POST /evidencias — anexa evidência FOTO (HTTP 201)` | Crítico |
| `E2. POST /evidencias — tarefa não pertence ao capataz (HTTP 404, RN05)` | Crítico |
| `E3. POST /evidencias — tipo ausente (HTTP 400)` | Médio |
| `E4. POST /evidencias — persistência da evidência TEXTO no banco` | Crítico |

---

#### 12. `src/backend/tests/viewRoutes.test.ts` — 8 casos | MÉDIO
Valida renderização de templates EJS e redirecionamentos de rotas protegidas.

| Caso | Impacto |
|------|---------|
| `GET / — renderiza tela de seleção de perfil (rota pública)` | Médio |
| `GET /dashboard sem sessão — redireciona para /` | Médio |
| `GET /dashboard — retorna 200 e renderiza HTML` | Médio |
| `GET /tarefas sem sessão — redireciona para /` | Médio |
| `GET /nova-os sem sessão — redireciona para /` | Médio |
| `GET /historico sem sessão — redireciona para /` | Médio |
| `GET /configuracoes sem sessão — redireciona para /` | Médio |
| `GET /selecionar-retiro — renderiza tela de seleção de retiro` | Médio |

---

## CAUSA RAIZ 2 — `jest-environment-jsdom` não instalado

**Erro:** `Test environment jest-environment-jsdom cannot be found. As of Jest 28, must be installed separately.`

**Impacto: MÉDIO** — Isola apenas 1 suite, com 2 casos de teste.

#### 13. `src/backend/tests/chamados.frontend.test.ts` — 2 casos | MÉDIO
Testa a captura de GPS no front-end (RF006 — coordenadas do chamado).

| Caso | Impacto |
|------|---------|
| `preenche latitude e longitude quando a geolocation retorna coordenadas` | Médio |
| `mostra mensagem de erro quando geolocation não é suportado` | Médio |

---

## Casos de Teste Ausentes (não escritos)

Estes não são suites quebradas, mas lacunas de cobertura identificadas pelos CTs documentados nos comentários do código.

| Arquivo | CTs faltando | Cobertura ausente |
|---------|-------------|-------------------|
| `src/backend/tests/unit/nascimentoService.test.ts` | CT-NA02, CT-NA03, CT-NA04, CT-NA05 | Validação de `retiro_id`, `categoria`, `quantidade`, `capataz_id` ausentes (RF008) |
| `src/backend/tests/unit/alertaService.test.ts` | CT-UA02, CT-UA03, CT-UA04 | Casos não implementados para `criarAlerta` (possivelmente `tipo`, `descricao`, `capataz_id` ausentes) |

---

## Priorização para Correção

**1 — CRÍTICO | Instalar `cookie-parser` e seus tipos**
Corrige 12 suites de uma vez. Resolve 114 casos bloqueados, incluindo toda a cobertura de integração de RF001, RF006, RF007, RF008, RF009, RF011, JWT, RNF02, RNF-CAP, offline e sincronização.
Fix: `npm install cookie-parser @types/cookie-parser`

**2 — MÉDIO | Instalar `jest-environment-jsdom`**
Desbloqueia os testes de geolocalização do front-end (RF006, GPS).
Fix: `npm install --save-dev jest-environment-jsdom`

**3 — BAIXO | Implementar CT-NA02–05 e CT-UA02–04**
Fechar as lacunas de cobertura nos serviços de nascimento e alerta. Baixo porque os fluxos felizes já são cobertos; o que falta são as validações de campos obrigatórios individuais.

---

## Task: Corrigir Testes Unitários com Falha

Resultado da execução da suite unitária (`src/backend/tests/unit/`): **9 suites, 58 testes, 0 falhas.**

Não há testes unitários quebrados. Nenhuma correção é necessária nesta task.

### Suites passando

| Suite | Casos |
|-------|-------|
| `src/backend/tests/unit/healthService.test.ts` | 4 |
| `src/backend/tests/unit/exportacaoService.test.ts` | 4 |
| `src/backend/tests/unit/obitoService.test.ts` | 4 |
| `src/backend/tests/unit/nascimentoService.test.ts` | 2 |
| `src/backend/tests/unit/eventoService.test.ts` | 4 |
| `src/backend/tests/unit/alertaService.test.ts` | 8 |
| `src/backend/tests/unit/database.test.ts` | 4 |
| `src/backend/tests/unit/tarefaService.test.ts` | 13 |
| `src/backend/tests/unit/cloudSyncService.test.ts` | 15 |
| `src/backend/tests/initDb.test.ts` | 16 |
| `src/backend/tests/swagger.test.ts` | 1 |

Os únicos itens identificados dentro de `unit/` pelo mapeamento são casos ausentes (nunca escritos, não quebrados):

| Arquivo | CTs ausentes |
|---------|-------------|
| `src/backend/tests/unit/nascimentoService.test.ts` | CT-NA02, CT-NA03, CT-NA04, CT-NA05 |
| `src/backend/tests/unit/alertaService.test.ts` | CT-UA02, CT-UA03, CT-UA04 |

Todas as falhas da sprint estão em suites de integração, cujas causas raiz e correções estão documentadas acima.

---

## Task: Corrigir Testes de Integração com Falha

Resultado após a correção: **26 suites, 196 testes, 0 falhas.**

### Causa raiz identificada

`cookie-parser`, `@types/cookie-parser` e `jest-environment-jsdom` já estavam declarados no `package.json` mas não estavam presentes em `node_modules` — `npm install` nunca havia sido executado após esses pacotes serem adicionados ao projeto.

### Correção aplicada

Execução de `npm install`, que sincronizou o `node_modules` com as dependências já declaradas no `package.json`. Nenhum arquivo de teste ou de produção foi modificado.

### Resultado por suite

| Suite | Casos | Status |
|-------|-------|--------|
| `src/backend/tests/alertaIntegration.test.ts` | 5 | Passando |
| `src/backend/tests/auth-jwt.test.ts` | 4 | Passando |
| `src/backend/tests/contratos-rnf.test.ts` | 9 | Passando |
| `src/backend/tests/endpoints.test.ts` | 16 | Passando |
| `src/backend/tests/eventoIntegration.test.ts` | 18 | Passando |
| `src/backend/tests/frontend.test.ts` | 3 | Passando |
| `src/backend/tests/offline-operations.test.ts` | 11 | Passando |
| `src/backend/tests/outros-endpoints.test.ts` | 6 | Passando |
| `src/backend/tests/sincronizacaoIntegration.test.ts` | 12 | Passando |
| `src/backend/tests/tarefaIntegration.test.ts` | 7 | Passando |
| `src/backend/tests/uc01-planejar-tarefas.test.ts` | 15 | Passando |
| `src/backend/tests/viewRoutes.test.ts` | 8 | Passando |
| `src/backend/tests/chamados.frontend.test.ts` | 2 | Passando |
