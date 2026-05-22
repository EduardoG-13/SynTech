# Ponderada - Suite Jest com banco real

## Fluxo escolhido

O fluxo escolhido foi o **registro de nascimento de bezerro pelo Capataz**.

Justificativa: esse fluxo faz parte do núcleo da solução da BRPec, pois substitui a boleta física de movimentação do rebanho por um registro digital offline-first. Ele também é adequado para teste de ponta a ponta da regra de negócio porque envolve validação de payload, validação de quantidade, gravação em tabelas relacionadas (`movimentacoes`, `nascimentos`) e criação de item na fila de sincronização (`sync_queue`).

## Escopo testado

- Suite Jest em TypeScript: `src/tests/movimentacaoNascimento.test.ts`
- Configuração Jest/TypeScript: `jest.config.js` e `tsconfig.json`
- Camada de serviço: `src/services/movimentacaoService.ts`
- Camada de persistência: `src/repositories/movimentacaoRepository.ts`
- Banco real SQLite em memória nos testes, inicializado pelas migrations em `src/database/migrations`
- Integração externa mockada: `src/services/syncNotifier.ts`, via `jest.mock()`
- Limpeza e reseed do banco antes de cada teste com `beforeEach`

## Casos obrigatórios

| Caso obrigatório | Teste Jest | Resultado esperado |
| --- | --- | --- |
| Sucesso | `registra uma movimentacao de nascimento com sucesso` | Cria movimentação do tipo `nascimento`, retorna dados do registro e chama integração externa mockada |
| Regra de negócio violada | `bloqueia nascimento com regra de negocio violada` | Rejeita quantidade `0` com status lógico `422` |
| Payload inválido | `rejeita payload invalido sem campo obrigatorio` | Rejeita payload sem `categoria` com status lógico `400` |
| Persistência no banco | `persiste a movimentacao, o detalhe de nascimento e a fila de sincronizacao no banco real` | Confirma gravação em `movimentacoes`, `nascimentos` e `sync_queue` |
| Erro de banco | `retorna erro quando a persistencia viola uma chave estrangeira do banco real` | Confirma que uma FK inválida é rejeitada pelo banco real e não chama a integração externa |

## Matriz RF -> RN -> Teste

| RF | RN | Teste |
| --- | --- | --- |
| RF-MOV-01: Permitir ao Capataz registrar nascimento do rebanho | RN-MOV-01: O registro deve ter retiro, responsável, categoria, data e quantidade | `registra uma movimentacao de nascimento com sucesso` |
| RF-MOV-01: Permitir ao Capataz registrar nascimento do rebanho | RN-MOV-02: A quantidade de nascimentos deve ser maior que zero | `bloqueia nascimento com regra de negocio violada` |
| RF-MOV-01: Permitir ao Capataz registrar nascimento do rebanho | RN-MOV-03: Campos obrigatórios ausentes ou inválidos devem impedir a gravação | `rejeita payload invalido sem campo obrigatorio` |
| RF-SYNC-01: Preparar registros offline para sincronização posterior | RN-SYNC-01: Toda movimentação registrada offline deve entrar na fila de sincronização com status `pendente` | `persiste a movimentacao, o detalhe de nascimento e a fila de sincronizacao no banco real` |

## Output do npm test

```txt
> test
> jest

PASS src/tests/movimentacaoNascimento.test.ts
  Fluxo de registro de nascimento de bezerro
    ✓ registra uma movimentacao de nascimento com sucesso (6 ms)
    ✓ bloqueia nascimento com regra de negocio violada (1 ms)
    ✓ rejeita payload invalido sem campo obrigatorio
    ✓ persiste a movimentacao, o detalhe de nascimento e a fila de sincronizacao no banco real (1 ms)
    ✓ retorna erro quando a persistencia viola uma chave estrangeira do banco real (4 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        0.987 s, estimated 1 s
Ran all test suites.
```

## Extra de entrega: frontend demonstrativo

Foi criado um frontend simples para demonstrar o fluxo testado de ponta a ponta:

- Tela: `GET /`
- Arquivo da view: `src/views/index.ejs`
- CSS/JS estáticos: `src/public/styles.css` e `src/public/app.js`
- Preparação de dados de demo: `POST /demo/seed`
- Registro de nascimento: `POST /movimentacoes/nascimentos`
- Listagem de registros persistidos: `GET /movimentacoes/nascimentos`

Como demonstrar:

1. Rode `npm run migrate`
2. Rode `npm run dev`
3. Acesse `http://localhost:3000`
4. Clique em `Preparar demo`
5. Clique em `Registrar nascimento`
6. Use os botões `Simular quantidade 0` e `Simular FK inválida` para demonstrar os casos de erro

Validação manual feita via terminal:

```txt
POST /demo/seed
{"retiroId":"retiro-barra-bonita","responsavelId":"usuario-capataz-1"}

POST /movimentacoes/nascimentos
{"id":"7be2feab-028f-45f9-a9a9-1f03e1992fd6","retiroId":"retiro-barra-bonita","responsavelId":"usuario-capataz-1","tipo":"nascimento","categoria":"bezerro","dataMovimentacao":"2026-05-21","syncStatus":"pendente","quantidade":3,"raca":"nelore"}

POST /movimentacoes/nascimentos com quantidade 0
{"error":"A quantidade de nascimentos deve ser maior que zero"}
```
