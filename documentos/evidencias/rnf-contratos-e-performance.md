# Evidencias complementares de RNFs e contratos - BrPec

## 1. Objetivo

Este registro complementa o relatorio de endpoints com verificacoes automatizadas dos
contratos associados aos RNFs e as mudancas rastreadas na evolucao do backend.

## 2. Melhorias implementadas

| Item | Mudanca | Evidencia no codigo |
| --- | --- | --- |
| RN28 - exportacao validada | A consulta CSV passou a exportar somente movimentacoes com `m.validado = 1`. | `src/backend/repositories/exportacaoRepository.ts` |
| Compatibilidade CSV | Os campos exportados passaram a ser delimitados por aspas e aspas internas sao escapadas. O arquivo permanece em UTF-8 com BOM e delimitador regional `;`, adequado para abertura no Excel. | `src/backend/services/exportacaoService.ts` |
| RNF05 - integridade | A tabela `tarefas` passou a rejeitar estados diferentes de `PENDENTE`, `EM_ANDAMENTO` e `CONCLUIDA`. | `src/backend/database/migration.sql` |
| Execucao reproduzivel | A configuracao Jest da raiz passou a executar as suites em `src/backend/__tests__/` e `src/backend/tests/`. | `jest.config.js` |
| Build de producao | O TypeScript deixou de compilar arquivos Jest como codigo de producao. | `tsconfig.json` |

## 3. Casos automatizados adicionados

Arquivo: `src/backend/__tests__/contratos-rnf.test.ts`

| Caso | RNF / RN | Criterio comprovado |
| --- | --- | --- |
| Exportar somente registros validados | RN28 | Um registro com `validado = 1` aparece no CSV; um registro pendente nao aparece. |
| Restringir exportacao ao Coordenador | RNF01 parcial | O perfil Gerente recebe `403 Forbidden` ao solicitar exportacao. |
| Rejeitar estado invalido de tarefa | RNF05 | O SQLite rejeita a insercao de uma tarefa com status fora do contrato. |
| Processar lote heterogeneo | RNF03 | Um lote com alerta e movimentacao e processado com dois sucessos. |
| Rejeitar lote acima do limite | RNF-CAP | Um lote com 501 itens recebe `413 Payload Too Large`. |
| Listar 1.000 tarefas em ate 2 segundos | RNF02 | A listagem principal retorna as 1.000 tarefas dentro do limite definido na Ponderada I. |

## 4. Execucao local

Comandos executados:

```bash
npm test -- --runInBand
npm run build
```

Resultado dos testes:

```text
Test Suites: 4 passed, 4 total
Tests:       41 passed, 41 total
Snapshots:   0 total
```

Resultado do build:

```text
> build
> tsc
```

O build terminou com codigo de saida `0`.

## 5. Limites ainda declarados

As melhorias acima nao transformam o MVP em uma solucao pronta para producao. Permanecem
registradas como evolucoes futuras:

- autenticacao e autorizacao centralizadas;
- operacao offline ponta a ponta no cliente com IndexedDB e Service Worker;
- teste de usabilidade com usuarios representativos;
- medicao continua de latencia p95 em ambiente de homologacao.

