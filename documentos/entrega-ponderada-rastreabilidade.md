# Ponderada - Rastreabilidade da evolucao do backend BrPec

## 1. Resumo executivo

Esta entrega registra a evolucao real do backend BrPec em relacao as Ponderadas I e II.
O objetivo nao e afirmar que todo o sistema esta finalizado, mas demonstrar rastreabilidade:
o que foi modelado, o que foi implementado, onde esta a evidencia e quais pontos ainda
dependem de evolucao.

A trilha principal atende ao minimo solicitado e vai alem dele:

| Criterio | Resultado |
| --- | --- |
| Personas distintas | 3: Gerente, Capataz e Coordenador |
| RFs na trilha principal | 5: RF001, RF002, RF006, RF008 e RF015 |
| Linhas RF + RN na trilha principal | 15 linhas, sem celulas vazias |
| RNFs revisitados | 8 eixos definidos na Ponderada I |
| Mudancas de contrato registradas | 7 |
| Evidencias indexadas | 13 |
| Verificacao automatizada atual | 41 testes aprovados em 4 suites; build aprovado |

## 2. Personas cobertas

| Persona | Perfil | Necessidade principal | RFs rastreados |
| --- | --- | --- | --- |
| Joao Pereira | Gerente Geral | Planejar e acompanhar atividades dos retiros. | RF001, RF007 |
| Gabriel Galdino | Capataz | Executar operacoes simples em campo, inclusive com conectividade limitada. | RF002, RF006, RF008, RF009, RF010, RF011, RF012 |
| Marcos Cesar Filho | Coordenador | Consolidar, validar e exportar movimentacoes. | RF014, RF015 |

As personas completas estao no WAD, secao `2.2. Personas`.

## 3. RTM principal - RF -> RN -> evidencia

Legenda:

- `Atendido`: implementacao e evidencia concreta localizadas.
- `Parcial`: parte do comportamento esta implementada, com lacuna declarada.
- `Pendente`: requisito modelado, mas sem evidencia concreta suficiente.

| Persona | RF | RN | Como aparece no fluxo | Evidencia | Status e justificativa |
| --- | --- | --- | --- | --- | --- |
| Joao - Gerente | RF001 - Criar tarefa | RN01 - Vincular tarefa a um unico retiro | Controller exige `retiro_id`; Service verifica vinculo do Capataz; banco usa `NOT NULL` e FK. | EV03, EV04, EV08 | Atendido. Ha testes de sucesso, persistencia e rejeicao de Capataz de outro retiro. |
| Gabriel - Capataz | RF002 - Visualizar tarefas do dia | RN02 - Exibir apenas tarefas do dia atual | Service calcula a data atual; Repository filtra a consulta pela data. | EV03, EV08 | Atendido. |
| Gabriel - Capataz | RF002 - Visualizar tarefas do dia | RN05 - Exibir apenas tarefas do Capataz | Repository filtra por `capataz_id`. | EV08 | Parcial. O filtro existe, mas o ID ainda e informado pelo cliente sem autenticacao confiavel. |
| Gabriel - Capataz | RF002 - Visualizar tarefas do dia | RN06 - Consultar offline somente tarefas sincronizadas | O comportamento esta modelado em DS02. | EV01 | Pendente. Nao foram localizados IndexedDB e Service Worker no cliente. |
| Gabriel - Capataz | RF002 - Visualizar tarefas do dia | RN07 - Manter tarefas previamente sincronizadas disponiveis offline | O comportamento esta modelado em DS02. | EV01 | Pendente. Falta evidencia client-side. |
| Gabriel - Capataz | RF006 - Criar alerta | RN19 - Capturar GPS automaticamente | Backend exige latitude e longitude. | EV03, EV09 | Parcial. Falta evidencia da captura automatica pelo cliente. |
| Gabriel - Capataz | RF006 - Criar alerta | RN20 - Enviar imediatamente quando online | Endpoint persiste e retorna `201 Created`. | EV03, EV09 | Atendido para o fluxo online. |
| Gabriel - Capataz | RF006 - Criar alerta | RN21 - Armazenar offline e sincronizar depois | Endpoint de lote aceita alertas. | EV10, EV13 | Parcial. Recepcao no servidor esta testada; armazenamento offline do cliente permanece pendente. |
| Gabriel - Capataz | RF006 - Criar alerta | RN22 - Exibir confirmacao apos envio | API retorna `Alerta criado com sucesso`. | EV03, EV09 | Atendido no contrato HTTP. |
| Gabriel - Capataz | RF006 - Criar alerta | RN23 - Informar salvamento local sem conexao | Regra registrada no WAD. | EV01 | Pendente. Falta interface offline implementada. |
| Gabriel - Capataz | RF006 - Criar alerta | RN24 - Manter GPS imutavel | Banco armazena coordenadas e nao ha endpoint de edicao. | EV04 | Parcial. Recomenda-se explicitar a regra se surgir edicao de alertas. |
| Gabriel - Capataz | RF006 - Criar alerta | RN25 - Registrar data e hora de criacao | Banco injeta `CURRENT_TIMESTAMP`. | EV04 | Atendido. |
| Gabriel - Capataz | RF006 - Criar alerta | RN26 - Associar alerta ao retiro | Controller exige retiro; banco usa `NOT NULL` e FK. | EV04, EV09 | Atendido. |
| Gabriel - Capataz | RF008 - Registrar nascimento | RN27 - Informar data, retiro, categoria e quantidade | Controller valida campos; Repository grava movimentacao e nascimento em transacao. | EV03, EV11 | Atendido para o fluxo online. |
| Marcos - Coordenador | RF015 - Exportar CSV | RN28 - Exportar somente dados validados | Repository filtra `m.validado = 1`; Service restringe perfil, gera CSV escapado e registra auditoria. | EV07, EV13 | Atendido. Teste automatizado garante que registro pendente nao aparece no CSV. |

## 4. Cobertura ampliada alem do minimo

| RF | Fluxo | Endpoint / artefato | Estado atual | Evidencia |
| --- | --- | --- | --- | --- |
| RF001 | Criar tarefa | `POST /api/tarefas` | Implementado e testado | EV03, EV08 |
| RF002 | Listar tarefas do dia | `GET /api/tarefas/hoje` | Implementado e testado online; offline parcial | EV03, EV08 |
| RF003 | Armazenar e concluir tarefa sincronizada | `PATCH /api/tarefas/:id/concluir` | Conclusao online implementada; cliente offline pendente | EV03, EV08 |
| RF004 | Anexar evidencia | `POST /api/tarefas/:id/evidencias` | Implementado e testado | EV03, EV08 |
| RF005 | Anexar audio curto | Estrutura de evidencia | Parcial: modelo suporta metadados; gravacao client-side pendente | EV04 |
| RF006 | Criar chamado de infraestrutura | `POST /api/chamados` | Implementado e testado online | EV03, EV09 |
| RF007 | Painel gerencial | `GET /api/painel-gerencial` | Implementado com validacao de perfil | EV12 |
| RF008 | Registrar nascimento | `POST /api/eventos-zootecnicos/nascimentos` | Implementado e testado | EV03, EV11 |
| RF009 e RF013 | Registrar obito com foto e campos obrigatorios | `POST /api/eventos-zootecnicos/obitos` | Implementado; teste automatizado dedicado recomendado | EV11 |
| RF010, RF011 e RF012 | Sincronizar lote e tratar falhas | `POST /api/sincronizacao/lote` | Recepcao e limite implementados e testados; disparo automatico client-side pendente | EV10, EV13 |
| RF014 | Listar eventos para Coordenador | `GET /api/eventos-zootecnicos` | Implementado com filtros e paginacao | EV11 |
| RF015 | Exportar CSV | `GET /api/exportacao/csv` | Implementado e testado com filtro RN28 | EV07, EV13 |

## 5. RNFs da Ponderada I

| Codigo | Eixo | Como o projeto atende hoje | Evidencia | Estado |
| --- | --- | --- | --- | --- |
| RNF01 | Seguranca | Ha verificacoes pontuais de perfil, pertencimento e FKs. | EV02, EV04, EV07, EV08 | Parcial. O MVP nao usa autenticacao centralizada; a mudanca esta registrada em MC01. |
| RNF02 | Desempenho | A listagem usa filtro SQL por Capataz e data. Teste automatizado cadastra e lista 1.000 tarefas em ate 2 segundos. | EV08, EV13 | Atendido para a operacao principal testada. |
| RNF03 | Disponibilidade / Offline-first | Backend processa lotes heterogeneos em transacoes isoladas, registra resultado e limita cada ciclo a 500 itens. | EV04, EV10, EV13 | Parcial. Recepcao do servidor comprovada; cliente offline ainda pendente. |
| RNF04 | Usabilidade | Ha wireframes, mockups, prints e CSS responsivo com contraste e botoes destacados. | EV05, EV06 | Parcial. Falta teste com usuarios que comprove o limite de passos. |
| RNF05 | Integridade | FKs ativas, campos obrigatorios, transacoes e `CHECK` de status das tarefas. | EV04, EV11, EV13 | Atendido no recorte rastreado. |
| RNF06 | Confiabilidade | Health-check, respostas de sucesso/erro, transacoes com rollback e 41 testes automatizados aprovados. | EV03, EV10, EV11, EV13 | Atendido no recorte funcional testado; medicao continua deve ser mantida em homologacao. |
| RNF07 | Auditabilidade | Timestamps automaticos, autoria em tarefas e movimentacoes, conclusao com data/hora e registro de exportacoes. | EV04, EV07, EV08 | Parcial. Autoria ainda depende do ID declarado pelo cliente enquanto nao houver autenticacao. |
| RNF08 | Manutenibilidade / Escalabilidade | Separacao Routes -> Controllers -> Services -> Repositories -> SQLite; build TypeScript aprovado. | EV02, EV12, EV13 | Atendido quanto a organizacao e verificacao de build. |

## 6. Registro de mudancas de contrato

| ID | Antes | Agora | Impacto / justificativa |
| --- | --- | --- | --- |
| MC01 | Supabase/Postgres, autenticacao e RLS previstos na Ponderada I. | MVP usa SQLite nativo e endpoints abertos, conforme decisao documentada. | RNF01 e RNF07 ficam parciais. A ausencia de autenticacao deve permanecer explicitamente limitada ao MVP. |
| MC02 | Ponderada I concentrava tres RFs de tarefas. | Backend inclui alertas, eventos zootecnicos, painel, sincronizacao e exportacao. | A RTM foi ampliada para representar o escopo real. |
| MC03 | Offline ponta a ponta previsto. | Servidor recebe lotes e registra sincronizacoes; cliente PWA ainda nao foi localizado. | RNF03 e regras offline permanecem parciais ou pendentes. |
| MC04 | RN28 estava definido, mas a exportacao aceitava movimentacoes nao validadas. | Consulta CSV passou a exigir `m.validado = 1`. | Divergencia corrigida e coberta por teste automatizado. |
| MC05 | Status de tarefa era obrigatorio, sem restricao de dominio. | SQLite passou a aceitar somente `PENDENTE`, `EM_ANDAMENTO` e `CONCLUIDA`. | Integridade reforcada e coberta por teste automatizado. |
| MC06 | WAD menciona RFC 4180 e Windows-1252. | Implementacao usa UTF-8 com BOM, delimitador regional `;` e escaping de aspas. | Contrato foi explicitado como CSV compativel com Excel; recomenda-se validar o arquivo com o parceiro. |
| MC07 | Suites Jest eram executadas por configuracoes diferentes. | Jest da raiz executa os dois diretorios de testes. | Execucao atual consolidada: 41 testes aprovados em 4 suites. |

## 7. Indice de evidencias

| ID | Artefato | Localizacao | Conteudo comprovado |
| --- | --- | --- | --- |
| EV01 | WAD | `documentos/wad.md` | Personas, RFs, RNs, diagramas e arquitetura modelada. |
| EV02 | Documentacao do backend | `src/backend/README_BACKEND.md` | Stack, camadas e decisao de autenticacao do MVP. |
| EV03 | Relatorio de endpoints | `documentos/evidencias/jest-testes-endpoints.md` | Evidencia historica dos testes de integracao. |
| EV04 | Migracao SQLite | `src/backend/database/migration.sql` | Tabelas, FKs, timestamps, fila, auditoria e constraint de status. |
| EV05 | Prints da versao 1 | `documentos/assets/prints-v1/` | Fluxos visuais implementados ou prototipados. |
| EV06 | Wireframes e mockups | `documentos/assets/` | Evidencias de usabilidade projetada. |
| EV07 | Exportacao CSV | `src/backend/services/exportacaoService.ts` e `src/backend/repositories/exportacaoRepository.ts` | Perfil Coordenador, escaping, filtro de validados e auditoria. |
| EV08 | Tarefas | `src/backend/services/tarefaService.ts` e `src/backend/repositories/tarefaRepository.ts` | RN01, consulta diaria, conclusao e evidencias. |
| EV09 | Alertas | `src/backend/controllers/alertaController.ts` e `src/backend/repositories/alertaRepository.ts` | Campos obrigatorios, GPS, retiro e persistencia. |
| EV10 | Sincronizacao | `src/backend/controllers/sincronizacaoController.ts`, `src/backend/services/sincronizacaoService.ts` e `src/backend/repositories/sincronizacaoRepository.ts` | Lotes, transacoes, resultados e limite. |
| EV11 | Eventos | `src/backend/controllers/eventoController.ts` e `src/backend/repositories/eventoRepository.ts` | Nascimentos, obitos, foto e transacoes. |
| EV12 | Arquitetura em camadas | `src/backend/controllers/`, `src/backend/services/` e `src/backend/repositories/` | Separacao de responsabilidades. |
| EV13 | Evidencias complementares de RNFs | `documentos/evidencias/rnf-contratos-e-performance.md` e `src/backend/__tests__/contratos-rnf.test.ts` | RN28, CSV, integridade, sincronizacao, capacidade, desempenho e build. |

## 8. Verificacao reproduzivel

Executar na raiz do repositorio:

```bash
npm install
npm test -- --runInBand
npm run build
```

Resultado atual:

```text
Test Suites: 4 passed, 4 total
Tests:       41 passed, 41 total
Snapshots:   0 total
```

O build TypeScript tambem termina com codigo de saida `0`.

## 9. Conclusao

A entrega minima foi superada com uma RTM principal completa, cobertura ampliada dos
endpoints, oito RNFs revisitados, sete mudancas de contrato e treze evidencias localizadas.
Os pontos nao finalizados foram declarados de forma objetiva. Isso preserva a
rastreabilidade real: o documento diferencia codigo executavel, evidencia visual,
modelagem e trabalho futuro.

