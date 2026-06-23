# Checklist de Critérios Impeditivos de Publicação - SP5

## Resultado

| Critério | Status |
|---|---|
| Testes | ✅ PASSOU |
| Build | ❌ FALHOU |

---

## Testes

**✅ PASSOU** - 26/26 suites passando, 206 testes.

A suite esteve com 50% de falhas durante a sprint. Causa raiz: `cookie-parser` e `jest-environment-jsdom` estavam declarados no `package.json` mas `npm install` não havia sido executado após a adição. Após `npm install`, todas as suites passaram sem alteração nos testes.

Detalhamento completo em `testes-quebrados-sprint5.md`.

---

## Build

**❌ FALHOU** - `tsc --noEmit` retorna 2 erros:

- `adminController.ts`: `Cannot find name 'db'` - import ausente.
- `boletaController.ts`: `Cannot find module './transferenciaController'` - arquivo pertencente a uma PR pendente (`fix(#418)`) ainda não mergeada.

Correções pendentes em PR separado.

---