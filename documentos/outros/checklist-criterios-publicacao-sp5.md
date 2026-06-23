# Checklist de Critérios Impeditivos de Publicação — SP5

## Resultado

| Critério | Status |
|---|---|
| Testes | ✅ PASSOU |
| Build | ❌ FALHOU |
| Deploy | — não avaliado |

---

## Testes

**✅ PASSOU** — 26/26 suites passando, 206 testes.

A suite esteve com 50% de falhas durante a sprint. Causa raiz: `cookie-parser` e `jest-environment-jsdom` estavam declarados no `package.json` mas `npm install` não havia sido executado após a adição. Após `npm install`, todas as suites passaram sem alteração nos testes.

Detalhamento completo em `testes-quebrados-sprint5.md`.

---

## Build

**❌ FALHOU** — `tsc --noEmit` retorna 2 erros:

```
controllers/adminController.ts(147,16): error TS2304: Cannot find name 'db'.
controllers/adminController.ts(165,18): error TS2304: Cannot find name 'db'.
controllers/adminController.ts(168,3): error TS2304: Cannot find name 'db'.
controllers/boletaController.ts(5,48): error TS2307: Cannot find module './transferenciaController' or its corresponding type declarations.
```

**Contexto:** os dois erros também estão presentes na branch `developer` no mesmo estado. Não foram introduzidos pelo trabalho desta sprint — `adminController.ts` usa `db` sem import desde antes, e `boletaController.ts` referencia `transferenciaController.ts`, que pertence a uma PR pendente (`fix(#418)`) ainda não mergeada na `developer`.

---

## Deploy

Não avaliado — deploy não foi realizado nesta sprint.
