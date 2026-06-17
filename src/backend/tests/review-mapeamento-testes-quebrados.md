# Review — Mapeamento de Testes Quebrados (Sprint 5)

---

## Resumo

O inventário produzido por @enzo.bezerra foi revisado e complementado. O núcleo estava correto: as 13 suites quebradas e as 2 causas raiz foram confirmadas. Foram identificadas omissões nas áreas de sincronização offline e autenticação com timeout, além de 8 suites unitárias não contabilizadas. Todos os ajustes foram incorporados diretamente em `testes-quebrados-sprint5.md`.

---

## O que estava correto

- **13 suites quebradas** — todos os arquivos existem; causas raiz (`cookie-parser` e `jest-environment-jsdom` ausentes) confirmadas.
- **Contagem de casos por suite** — precisa para as 13 suites mapeadas.
- **Priorização** — ordem correta pelo volume de desbloqueio.
- **Ambos os pacotes** já estão em `package.json` e `node_modules` — as causas raiz foram sanadas após o mapeamento.

---

## Ajustes incorporados

### AJ-01 ✅ — Suites de sincronização adicionadas

**`sync-retry.test.ts`** (3 casos) — cobre backoff exponencial com jitter, retry até sucesso e não-retry de erros não-transitórios (resiliência da fila offline, RF011 / RNF-CONF).

**`unit/cloudSyncService.test.ts`** (15 casos, CT-CS01 a CT-CS15) — suite mais abrangente de sincronização: suspensão offline, sync de tarefas/alertas, transações COMMIT/ROLLBACK para todas as movimentações, evidências, retiros e usuários. Ambas passando 100%.

### AJ-02 ✅ — Suite de autenticação com timeout adicionada

**`critical-timeout.test.ts`** (2 casos) — cobre timeout em operações mutáveis e, especificamente, timeout nas chamadas de autenticação. Passando 100%.

### AJ-03 ✅ — Suites unitárias contabilizadas

As 7 suites abaixo foram adicionadas ao inventário. Todas passando:

| Suite | Casos | Área |
|-------|-------|------|
| `unit/tarefaService.test.ts` | 13 | Gestão de tarefas (CT-UT01–13) |
| `unit/healthService.test.ts` | 4 | Health check (CT-HS01–04) |
| `unit/database.test.ts` | 4 | Conectividade DB |
| `unit/obitoService.test.ts` | 4 | Óbitos / RF013 / RN07 (CT-OB01–04) |
| `unit/eventoService.test.ts` | 4 | Listagem de eventos |
| `unit/exportacaoService.test.ts` | 4 | Exportação / controle de acesso |
| `swagger.test.ts` | 1 | Documentação de API |

### AJ-04 ✅ — Seção de lacunas corrigida

**`alertaService.test.ts`:** CT-UA02, CT-UA03, CT-UA04 ainda ausentes (validações de `tipo`, `descricao`, `capataz_id` em `criarAlerta`). CT-UA07–CT-UA11 para `resolverChamado` estão implementados e passando — não eram lacunas, apenas não foram mencionados no mapeamento original.

**`nascimentoService.test.ts`:** CT-NA02–CT-NA05 ainda ausentes. CT-NA06 (data futura) **já existe e passa** — foi incorretamente listado como faltante no mapeamento original.

---

## Resumo quantitativo final

| Métrica | Original | Revisado |
|---------|----------|----------|
| Suites totais | 24 | 26 |
| Suites quebradas (histórico) | 13 | 13 |
| Suites passando | 11 | 13 |
| Casos bloqueados (histórico) | ~116 | ~116 |
| Casos passando | 75 | ~139 |
| Status atual da suite | 61% inoperante | 100% passando |
