# Adendo para a prova no papel - endpoints e persona Infra

## 1. Quarta persona

| Persona | Perfil | Acao no sistema |
| --- | --- | --- |
| Tecnico de Infraestrutura | Equipe de manutencao | Consulta os chamados, executa o atendimento e registra a resolucao com descricao e foto. |

## 2. Linha adicional da RTM

| Persona | RF | RN | Endpoint | Como comprovo | Status |
| --- | --- | --- | --- | --- | --- |
| Tecnico de Infraestrutura | RF016 - Resolver chamado de infraestrutura | RN29 - Registrar tecnico, solucao, foto, status e data da resolucao | `PATCH /api/chamados/:id/resolver` | O Service permite apenas perfil `Tecnico`; o Repository grava foto em `evidencias`, atualiza o alerta para `RESOLVIDO`, salva `tecnico_id`, `solucao_resolucao` e `resolvido_em`. | Atendido. Teste automatizado cobre sucesso e bloqueio de perfil indevido. |

O `RF016` registra a ampliacao do contrato em relacao a modelagem anterior. Ele transforma
a persona de Infraestrutura em ator efetivo do backend, sem esconder que o fluxo foi
adicionado durante a evolucao do projeto.

## 3. Endpoints para listar no papel

| Metodo | Endpoint | Persona principal | Funcao |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Equipe tecnica | Verificar saude do servidor e banco. |
| `POST` | `/api/tarefas` | Gerente | Criar tarefa. |
| `GET` | `/api/tarefas/hoje` | Capataz | Listar tarefas do dia. |
| `PATCH` | `/api/tarefas/:id/concluir` | Capataz | Concluir tarefa. |
| `POST` | `/api/tarefas/:id/evidencias` | Capataz | Anexar evidencia. |
| `POST` | `/api/chamados` | Capataz | Criar alerta de infraestrutura. |
| `GET` | `/api/chamados?status=ABERTO` | Tecnico de Infraestrutura | Listar chamados para atendimento. |
| `PATCH` | `/api/chamados/:id/resolver` | Tecnico de Infraestrutura | Resolver chamado com descricao e foto. |
| `POST` | `/api/eventos-zootecnicos/nascimentos` | Capataz | Registrar nascimento. |
| `POST` | `/api/eventos-zootecnicos/obitos` | Capataz | Registrar obito. |
| `GET` | `/api/eventos-zootecnicos` | Coordenador | Listar movimentacoes. |
| `GET` | `/api/painel-gerencial` | Gerente | Consultar painel consolidado. |
| `POST` | `/api/sincronizacao/lote` | Sistema | Sincronizar registros pendentes. |
| `GET` | `/api/exportacao/csv` | Coordenador | Exportar dados validados. |

## 4. Mudanca de contrato adicional

| ID | Antes | Agora | Impacto |
| --- | --- | --- | --- |
| MC08 | O prototipo mostrava a tela de resolucao da Infraestrutura, mas o backend nao possuia endpoint para concluir o atendimento. | Foram adicionados `GET /api/chamados` e `PATCH /api/chamados/:id/resolver`. | A quarta persona passou a participar do fluxo executavel. A resolucao registra tecnico, descricao, foto, status e data/hora. |

## 5. Evidencia adicional

| ID | Localizacao | O que comprova |
| --- | --- | --- |
| EV14 | `src/backend/routes/alertaRoutes.ts`, `src/backend/controllers/alertaController.ts`, `src/backend/services/alertaService.ts`, `src/backend/repositories/alertaRepository.ts` e `src/backend/__tests__/contratos-rnf.test.ts` | Listagem e resolucao de chamados pela persona Tecnico de Infraestrutura, incluindo autorizacao por perfil e foto de evidencia. |

## 6. Texto curto para memorizar

> Alem de Gerente, Capataz e Coordenador, o sistema aciona o Tecnico de Infraestrutura.
> O Capataz abre um chamado com `POST /api/chamados`. O Tecnico consulta os chamados
> com `GET /api/chamados` e registra a resolucao com
> `PATCH /api/chamados/:id/resolver`. A resolucao exige descricao e foto, salva o
> tecnico responsavel e altera o status para `RESOLVIDO`.
