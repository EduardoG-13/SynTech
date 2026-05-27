# Evidências de Testes de Integração com Jest — WebAPI BrPec

Este documento reúne o relatório técnico e a comprovação do correto funcionamento de todos os endpoints da WebAPI do projeto BrPec Agropecuária. Os testes foram executados de forma totalmente automatizada no SQLite em memória, garantindo isolamento absoluto de dados e a repetibilidade das asserções de contrato HTTP e regras de negócio.

---

## 1. Informações do Ambiente de Testes

- **Ferramenta de Execução**: Jest 29.7.0 (`ts-jest`) + Supertest 7.2.2
- **Banco de Dados**: SQLite em memória (`:memory:`)
- **Node.js**: >= 22.5.0 (usando a API nativa `DatabaseSync` para operações síncronas)
- **Status dos Testes**: 100% dos testes concluídos com sucesso (PASS).

---

## 2. Quantitativos de Cobertura

- **Quantidade de Endpoints Testados**: 7 endpoints (toda a API implementada)
- **Quantidade de Casos de Teste**: 19 casos
- **Resultado consolidado**:
  - **Suites executadas**: 2
  - **Suites bem-sucedidas**: 2
  - **Casos executados**: 19
  - **Casos aprovados**: 19
  - **Casos reprovados**: 0

---

## 3. Matriz Completa de Casos de Teste

### 3.1. Suite 1 — `tests/uc01-planejar-tarefas.test.ts` (14 testes)

| ID | Endpoint / Operação | Cenário de Teste | Validação (Assertion) | Status HTTP | Resultado |
|:---:|:---|:---|:---|:---:|:---:|
| **C1** | `POST /api/tarefas` | Criar tarefa com dados válidos | Sucesso, status PENDENTE | `201 Created` | **Aprovado** |
| **C2** | `POST /api/tarefas` | Capataz fora do retiro informado | Regra de negócio `RN01` violada | `422 Unprocessable Entity` | **Aprovado** |
| **C3** | `POST /api/tarefas` | Falta de campos obrigatórios | Erro com payload inválido | `400 Bad Request` | **Aprovado** |
| **C4** | `POST /api/tarefas` | Persistência no SQLite | Registro no banco idêntico ao enviado | `201 Created` | **Aprovado** |
| **H1** | `GET /api/tarefas/hoje` | Buscar tarefas do dia de hoje | Retorna array de tarefas com modo online | `200 OK` | **Aprovado** |
| **H2** | `GET /api/tarefas/hoje` | Capataz sem tarefas hoje | Retorna array vazio | `200 OK` | **Aprovado** |
| **H3** | `GET /api/tarefas/hoje` | Busca sem `capataz_id` | Erro informando parâmetro ausente | `400 Bad Request` | **Aprovado** |
| **K1** | `PATCH /api/tarefas/:id/concluir` | Conclusão bem-sucedida de tarefa | Altera status para CONCLUIDA | `200 OK` | **Aprovado** |
| **K2** | `PATCH /api/tarefas/:id/concluir` | Conclusão por capataz não responsável | Erro de não encontrado/permissão | `404 Not Found` | **Aprovado** |
| **K3** | `PATCH /api/tarefas/:id/concluir` | Persistência do campo `concluida_em` | Campo gravado com data/hora no SQLite | `200 OK` | **Aprovado** |
| **E1** | `POST /api/tarefas/:id/evidencias` | Anexar foto base64 à tarefa | Retorna `evidencia_id` criado | `201 Created` | **Aprovado** |
| **E2** | `POST /api/tarefas/:id/evidencias` | Anexar em tarefa de outro capataz | Regra de negócio `RN05` violada | `404 Not Found` | **Aprovado** |
| **E3** | `POST /api/tarefas/:id/evidencias` | Falta de tipo ou arquivo base64 | Payload incorreto | `400 Bad Request` | **Aprovado** |
| **E4** | `POST /api/tarefas/:id/evidencias` | Persistência da evidência tipo TEXTO | Registro inserido na tabela `evidencias` | `201 Created` | **Aprovado** |

### 3.2. Suite 2 — `tests/outros-endpoints.test.ts` (5 testes)

| ID | Endpoint / Operação | Cenário de Teste | Validação (Assertion) | Status HTTP | Resultado |
|:---:|:---|:---|:---|:---:|:---:|
| **H1** | `GET /api/health` | Verificar saúde do servidor | Servidor "ok" e banco "conectado" | `200 OK` | **Aprovado** |
| **A1** | `POST /api/chamados` | Registrar alerta de infraestrutura | Sucesso, status ABERTO | `201 Created` | **Aprovado** |
| **A2** | `POST /api/chamados` | Alerta sem latitude/longitude | Campos obrigatórios ausentes | `400 Bad Request` | **Aprovado** |
| **E1** | `POST /api/eventos-zootecnicos/nascimentos` | Registrar nascimento animal | Registro inserido em movimentações/nascimentos | `201 Created` | **Aprovado** |
| **E2** | `POST /api/eventos-zootecnicos/nascimentos` | Falta de quantidade ou categoria | Campos obrigatórios ausentes | `400 Bad Request` | **Aprovado** |

---

## 4. Evidência Visual da Execução (Terminal Logs)

Abaixo, apresenta-se a captura em texto e imagem da execução bem-sucedida do comando `npm test`:

### 4.1. Logs do Terminal

```bash
> brpec-backend@0.1.0 test
> jest --runInBand --forceExit

  console.log
    [database] Banco SQLite conectado: /Users/mcristiano/g03/src/backend/:memory:

      at Object.<anonymous> (config/database.ts:27:9)

  console.log
    [initDb] Banco de dados inicializado com sucesso

      at inicializarBanco (config/initDb.ts:28:13)

PASS tests/outros-endpoints.test.ts
  H — GET /api/health (Health check)
    ✓ H1. Sucesso — retorna status 200 com informações de saúde do servidor e banco (26 ms)
  A — POST /api/chamados (Criar Alerta)
    ✓ A1. Sucesso — cria alerta com dados válidos e retorna HTTP 201 (13 ms)
    ✓ A2. Payload inválido — campos obrigatórios ausentes retorna HTTP 400 (5 ms)
  E — POST /api/eventos-zootecnicos/nascimentos (Registrar Nascimento)
    ✓ E1. Sucesso — registra nascimento animal com sucesso e retorna HTTP 201 (5 ms)
    ✓ E2. Payload inválido — campos obrigatórios ausentes retorna HTTP 400 (6 ms)

  console.log
    [database] Banco SQLite conectado: /Users/mcristiano/g03/src/backend/:memory:

      at Object.<anonymous> (config/database.ts:27:9)

  console.log
    [initDb] Banco de dados inicializado com sucesso

      at inicializarBanco (config/initDb.ts:28:13)

PASS tests/uc01-planejar-tarefas.test.ts
  C — POST /api/tarefas (criar tarefa — UC01 / RF001)
    ✓ C1. Sucesso — cria tarefa com dados válidos e retorna HTTP 201 (23 ms)
    ✓ C2. Regra de negócio (RN01) — capataz não pertence ao retiro retorna HTTP 422 (5 ms)
    ✓ C3. Payload inválido — campos obrigatórios ausentes retorna HTTP 400 (4 ms)
    ✓ C4. Persistência — tarefa gravada no banco com todos os campos corretos (3 ms)
  H — GET /api/tarefas/hoje (buscar tarefas do dia)
    ✓ H1. Sucesso — retorna tarefa do dia para capataz com HTTP 200 (5 ms)
    ✓ H2. Sucesso — retorna array vazio quando capataz não tem tarefas hoje (4 ms)
    ✓ H3. Payload inválido — capataz_id ausente retorna HTTP 400 (3 ms)
  K — PATCH /api/tarefas/:id/concluir (concluir tarefa)
    ✓ K1. Sucesso — conclui tarefa e retorna HTTP 200 com status CONCLUIDA (5 ms)
    ✓ K2. Erro — concluir tarefa que não pertence ao capataz retorna HTTP 404 (5 ms)
    ✓ K3. Persistência — status e concluida_em atualizados no banco após conclusão (5 ms)
  E — POST /api/tarefas/:id/evidencias (anexar evidência)
    ✓ E1. Sucesso — anexa evidência FOTO e retorna HTTP 201 com evidencia_id (5 ms)
    ✓ E2. Regra de negócio (RN05) — tarefa não pertence ao capataz retorna HTTP 404 (4 ms)
    ✓ E3. Payload inválido — tipo ausente retorna HTTP 400 (5 ms)
    ✓ E4. Persistência — evidência TEXTO gravada no banco com tarefa_id correto (5 ms)

Test Suites: 2 passed, 2 total
Tests:       19 passed, 19 total
Snapshots:   0 total
Time:        1.373 s, estimated 2 s
Ran all test suites.
```

### 4.2. Captura de Tela da Execução

Captura de tela mostrando a execução bem sucedida dos testes com todos os 19 casos aprovados em verde

</center>
<img src="../assets/jest.png" width="800"/>
  
Fonte: Próprios autores (2026).</p>
</center>
