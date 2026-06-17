# Review — Mapeamento de Testes Quebrados (Sprint 5)

**Revisor:** @arthur.morais  
**Tarefa revisada:** [SP5] Mapeamento de testes quebrados — @enzo.bezerra  
**Data da revisão:** 2026-06-17  
**Veredicto:** ⚠️ DEVOLVIDO COM AJUSTES SOLICITADOS

---

## Resumo da Revisão

O inventário produzido por @enzo.bezerra é sólido no núcleo: as 13 suites quebradas identificadas existem, as 2 causas raiz são reais, e a priorização CRÍTICO → MÉDIO → BAIXO está correta. Porém há **omissões significativas nas áreas de sincronização offline e autenticação** — exatamente as áreas que os critérios de aceite exigem cobertura — e inconsistências na seção de lacunas de cobertura. O mapeamento precisa ser complementado antes de ser aprovado.

---

## ✅ O que está correto e pode ser mantido

1. **13 suites quebradas** — todos os arquivos listados existem em `src/backend/tests/` e as causas raiz reportadas são confirmadas:
   - CAUSA RAIZ 1: `cookie-parser` / `@types/cookie-parser` ausentes → 12 suites afetadas (CRÍTICO)
   - CAUSA RAIZ 2: `jest-environment-jsdom` ausente → 1 suite afetada (MÉDIO)

2. **Contagem de casos por suite** — verificada e precisa para as 13 suites mapeadas.

3. **Priorização** — a ordem (cookie-parser → jsdom → lacunas de unit) é apropriada pelo volume de desbloqueio.

4. **Nota:** ambos os pacotes já constam em `package.json` (como `"cookie-parser": "^1.4.7"` em `dependencies` e `"jest-environment-jsdom": "^30.4.1"` em `devDependencies`) e estão instalados em `node_modules`. Isso deve ser registrado como estado atual — as causas raiz descritas foram sanadas após o mapeamento, mas o documento deve deixar isso explícito para não gerar confusão.

---

## ❌ Ajustes Solicitados

### AJ-01 — CRÍTICO | Suites de sincronização não mapeadas

O documento afirma mapear todas as suites. Porém duas suites de sincronização offline existem e não foram incluídas:

**`src/backend/tests/sync-retry.test.ts` — 3 casos**  
Cobertura: backoff exponencial com jitter, retry até sucesso sem intervenção do usuário, não-retry de erros não-transitórios.  
Impacto: cobre RF011 / RNF-CONF diretamente — resiliência da fila offline.

**`src/backend/tests/unit/cloudSyncService.test.ts` — 15 casos (CT-CS01 a CT-CS15)**  
Cobertura: suspensão offline, sync de tarefas e alertas, transações com COMMIT e ROLLBACK para movimentações (nascimento, óbito, transferência, compravenda), evidências, retiros, usuários.  
Impacto: suite mais abrangente de sincronização do projeto. Ausência no inventário representa omissão crítica na área de sincronização offline exigida pelos critérios de aceite (RNF:CONF).

**Ação solicitada:** incluir ambas as suites no inventário com status (passando ou quebrada) e nível de impacto.

---

### AJ-02 — CRÍTICO | Suite de autenticação com timeout não mapeada

**`src/backend/tests/critical-timeout.test.ts` — 2 casos**  
Casos: `salva operação mutável na fila local quando a requisição expira` e `aplica timeout nas chamadas de autenticação`.  
Impacto: cobre comportamento de timeout durante chamadas de autenticação — área de autenticação citada explicitamente nos critérios de aceite da revisão.

**Ação solicitada:** incluir esta suite e registrar se está passando ou quebrada.

---

### AJ-03 — MÉDIO | Demais suites não contabilizadas

As suites abaixo existem e não aparecem nem como "passando" nem como "quebradas":

| Suite | Casos | Área |
|-------|-------|------|
| `unit/tarefaService.test.ts` | 15 | Gestão de tarefas |
| `unit/healthService.test.ts` | 4 | Health check |
| `unit/database.test.ts` | 4 | Conectividade DB |
| `unit/obitoService.test.ts` | 4 | Eventos zootécnicos |
| `unit/eventoService.test.ts` | 4 | Eventos zootécnicos |
| `unit/exportacaoService.test.ts` | 6 | Exportação |
| `swagger.test.ts` | — | Documentação API |

O inventário soma 24 suites (13 quebradas + 11 passando). O Jest detecta 26 arquivos de teste. As suites unitárias, se passando, aumentam a contagem de "75 casos passando" significativamente e mudam o percentual de 61% inoperante reportado no resumo executivo.

**Ação solicitada:** verificar status de cada suite acima e incluir no resumo executivo com contagem atualizada.

---

### AJ-04 — BAIXO | Seção de lacunas de cobertura imprecisa

A seção "Casos de Teste Ausentes" apresenta inconsistências:

**`alertaService.test.ts`:** o documento diz que faltam CT-UA02, CT-UA03, CT-UA04. O arquivo real contém **CT-UA01, CT-UA05 a CT-UA11** (7 casos), incluindo a suite `resolverChamado` (CT-UA07 a CT-UA11) não mencionada no documento. Os CTs ausentes são diferentes dos descritos.

**`nascimentoService.test.ts`:** o documento diz que faltam CT-NA02 a CT-NA05 (validação de `retiro_id`, `categoria`, `quantidade`, `capataz_id`). O arquivo real contém CT-NA01 e CT-NA06 — confirmando que CT-NA02 a CT-NA05 estão ausentes, mas CT-NA06 (data futura) **já foi implementado** e não aparece no documento.

**Ação solicitada:** revisar a lista de CTs ausentes com base no conteúdo atual dos arquivos.

---

## Quantitativo Corrigido (estimativa)

| Métrica | Documento | Real (estimado) |
|---------|-----------|-----------------|
| Suites totais | 24 | ≥ 26 |
| Suites quebradas | 13 | 13 (confirmado) |
| Suites passando | 11 | ≥ 13 |
| Casos bloqueados | ~116 | ~116 (confirmado) |
| Casos passando | 75 | > 75 (unit tests não contados) |

---

## Próximos Passos

1. @enzo.bezerra complementar o inventário com AJ-01 e AJ-02 (críticos — sync e auth).
2. Verificar e registrar status das 7 suites de AJ-03.
3. Corrigir seção de lacunas conforme AJ-04.
4. Após ajustes, revisão pode ser aprovada sem nova rodada completa — basta confirmar os itens acima estão cobertos.
