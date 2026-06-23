# [REVIEW] Enunciados de Usabilidade — Sprint 5

**Revisor**: @laiza.guimaraes  
**Tarefa Original**: @lorena.kopke  
**Data da Revisão**: 2026-06-23  
**Status**: ✅ APROVAÇÃO CONDICIONAL  

---

## 1. Resumo Executivo

Os **6 enunciados de usabilidade** (3 para Capataz, 2 para Gerente, 1 para Coordenador) cobrem bem os **fluxos principais do sistema** com metodologia consistente e progressão de dificuldade apropriada. Os testes de guerrilha (22 sessões) e SUS (7 respondentes) geraram evidências concretas e acionáveis.

**Parecer**: Aprovado para documentação e validação de interface, com **2 condições obrigatórias** antes da publicação final:
1. Completar análise SUS (calcular escore final 0-100)
2. Adicionar testes de cenário offline (gap crítico em RNF05)

---

## 2. Validação de Cobertura

### 2.1. Perfis de Usuário (3 fluxos principais)

| Perfil | Tarefas | US Cobertas | Status |
|--------|---------|-------------|--------|
| **Capataz** | 1, 2 | US02–US10 (parcial) | ✅ 2 tarefas; faltam US03-US05 (offline) |
| **Gerente** | 3, 4 | US01, US07 (parcial) | ✅ 2 tarefas; faltam dashboards rebanho |
| **Coordenador** | 5, 6 | US11, US12 (completo) | ✅ 2 tarefas; cobertura total |

**Conclusão**: Os 3 fluxos estão validados. Capataz e Gerente com gaps em funcionalidades secundárias.

### 2.2. Requisitos Funcionais (RF)

| RF | Tarefa(s) | Status |
|----|-----------|--------|
| RF001 | 3 (Criar tarefa) | ✅ |
| RF002 | 1 (Visualizar tarefas) | ✅ |
| RF003 | 1 (Concluir tarefa) | ✅ |
| RF006 | 2 (Criar chamado) | ✅ Testado; **Resultado: 0/3 sucesso** ⚠️ |
| RF007 | 4 (Consultar infraestrutura) | ✅ 3/3 sucesso |
| RF008 | 5 (Visualizar movimentação) | ✅ 4/4 sucesso |
| RF014 | 5 (Consultar eventos) | ✅ |
| RF015 | 6 (Exportar CSV) | ✅ 3/3 sucesso |

**Conclusão**: RF001–RF015 cobertos. **Alerta**: RF006 tem falha crítica (HTTP 400).

### 2.3. Requisitos Não-Funcionais (RNF)

| RNF | Aspecto Testado | Resultado |
|-----|-----------------|-----------|
| **RNF:USAB** | Facilidade de operação | ✅ Validado via guerrilha e SUS |
| **RNF05** (Confiabilidade offline) | Sincronização offline | ❌ **NÃO TESTADO** — Gap crítico |
| **RNF02** (Performance) | Tempo resposta | ⚠️ Não mensurado nos enunciados |

**Conclusão**: USAB validado. Offline (RNF05) sem cobertura — recomendação de Sprint 6.

---

## 3. Análise Detalhada por Tarefa

### Tarefa 1: Capataz — Concluir Tarefa com Foto

**Status**: ✅ 4/6 sucesso (66,7%)

| Métrica | Resultado | Avaliação |
|---------|-----------|-----------|
| Taxa de conclusão | 4 sucesso, 1 com dificuldade, 1 falha | Aceitável |
| Problema crítico | Falta de feedback de sincronização (H1, H3) | Severidade 3 — Grave |
| Heurísticas afetadas | H1 (Visibilidade), H3 (Controle do usuário) | 2/10 heurísticas |

**Feedback**: Fluxo intuitivo, mas falta confirmação visual pós-envio. Participante não sabia se foto foi sincronizada.

**Ação Recomendada**: Adicionar toast/snackbar com "Tarefa concluída e enviada ✓" ao finalizar.

---

### Tarefa 2: Capataz — Abrir Chamado de Infraestrutura

**Status**: ❌ 0/3 sucesso (0%)

| Métrica | Resultado | Avaliação |
|---------|-----------|-----------|
| Taxa de conclusão | 0 sucesso | **FALHA TOTAL** |
| Problema crítico | HTTP 400 em qualquer categoria selecionada | Severidade 4 — **CATASTRÓFICO** |
| Heurísticas afetadas | H5 (Prevenção de erros), H9 (Diagnóstico/recuperação) | 2/10 heurísticas |
| Participantes afetados | Fernanda, Gabriel Cristino, Davi (100%) | Sem variação |

**Feedback**: Endpoint retorna 400 independente do payload. Interface aceita submissão, mas backend rejeita. Mensagem de erro genérica não orienta usuário.

**Ação Recomendada** (Bloqueador): 
- Corrigir validação no endpoint `/api/chamados` (revisar mapping de categoria)
- Retornar status 201 com mensagem "Chamado criado com sucesso"
- Exibir mensagem de erro específica se validação falhar (ex: "Categoria inválida")

---

### Tarefa 3: Gerente — Criar Tarefa Calendarizada

**Status**: ✅ 2/3 sucesso (66,7%)

| Métrica | Resultado | Avaliação |
|---------|-----------|-----------|
| Taxa de conclusão | 2 sucesso, 1 falha | Aceitável com ressalva |
| Problema | Ausência de confirmação pós-cadastro | Severidade 3 — Grave |
| Participante afetado | Fernanda (não localizou tarefa criada) | 1/3 |

**Feedback**: Formulário claro, mas após salvar, não há redirecionamento nem destaque. Usuário interpreta como falha.

**Ação Recomendada**: Exibir modal "Tarefa criada com sucesso" e redirecionar para a lista com novo item destacado.

---

### Tarefa 4: Gerente — Consultar Tela de Infraestrutura

**Status**: ✅ 3/3 sucesso (100%)

| Métrica | Resultado | Avaliação |
|---------|-----------|-----------|
| Taxa de conclusão | Sucesso total | ✅ **Sem problemas** |
| Heurísticas | H1, H6 aplicadas corretamente | — |

**Feedback**: Fluxo mais simples (leitura, filtro, detalhe) foi bem executado. Participantes entenderam rapidamente.

---

### Tarefa 5: Coordenador — Visualizar Movimentação Zootécnica

**Status**: ✅ 4/4 sucesso (100%)

| Métrica | Resultado | Avaliação |
|---------|-----------|-----------|
| Taxa de conclusão | Sucesso total | ✅ **Sem problemas** |

**Feedback**: Fluxo de visualização e filtro foi intuitivo para todos.

---

### Tarefa 6: Coordenador — Exportar Dados em CSV

**Status**: ✅ 3/3 sucesso (100%)

| Métrica | Resultado | Avaliação |
|---------|-----------|-----------|
| Taxa de conclusão | Sucesso total | ✅ **Sem problemas** |
| Cobertura RN28 | Validação de dados já registrados | ✅ |

**Feedback**: Exportação funcionou conforme esperado. Dados íntegros, sem redigitação.

---

## 4. Análise de Testes de Guerrilha

### 4.1. Participantes e Sessões

| Aspecto | Dados | Avaliação |
|--------|-------|-----------|
| Total de participantes | 6 | Bom (5-8 é padrão para guerrilha) |
| Experiência rural | 1/6 (Gregory) | ⚠️ Enviesado; não representa capatazes reais |
| Perfil de recrutamento | Estudantes de graduação | ⚠️ Limitação: sem experiência agropecuária |
| Total de sessões | 22 | Excelente cobertura |

**Recomendação**: Próxima iteração deve incluir **mínimo 3-5 capatazes reais** da BrPec ou região Pantanal.

### 4.2. Taxa de Conclusão Consolidada

| Tarefa | Perfil | Sessões | Sucesso | Com Dificuldade | Falha | Taxa |
|--------|--------|---------|---------|-----------------|-------|------|
| 1 | Capataz | 6 | 4 | 1 | 1 | 66,7% |
| 2 | Capataz | 3 | 0 | 0 | 3 | 0% ⚠️ |
| 3 | Gerente | 3 | 2 | 0 | 1 | 66,7% |
| 4 | Gerente | 3 | 3 | 0 | 0 | 100% ✅ |
| 5 | Coordenador | 4 | 4 | 0 | 0 | 100% ✅ |
| 6 | Coordenador | 3 | 3 | 0 | 0 | 100% ✅ |

**Síntese**: Coordenador = 100% (estável), Gerente = 83%, Capataz = 33% (crítico).

### 4.3. Problemas Identificados (Priorização por Severidade Nielsen)

| # | Problema | Severidade | Tarefa(s) | Ação |
|---|----------|------------|-----------|------|
| 1 | HTTP 400 em endpoint de chamados | **4 — Catastrófico** | 2 | 🚨 Corrigir imediatamente |
| 2 | Falta de feedback de sincronização em tarefa | **3 — Grave** | 1 | ⚠️ Adicionar toast de confirmação |
| 3 | Sem feedback após criar tarefa | **3 — Grave** | 3 | ⚠️ Adicionar modal + redirecionamento |

**Conclusão**: 3 problemas identificados; 1 catastrófico, 2 graves. Todos endereçáveis.

---

## 5. Análise de Testes SUS

### 5.1. Questões Analisadas (4 de 10)

| Questão | Polaridade | Média | Interpretação |
|---------|-----------|-------|---------------|
| 1 — "Gostaria de usar com frequência" | Positiva | 4,0/5 | ✅ Bom — 71% concordam |
| 2 — "Sistema desnecessariamente complexo" | Negativa | 1,71/5 | ✅ Excelente — 86% discordam |
| 3 — "Fácil de usar" | Positiva | 4,29/5 | ✅ Excelente — 86% concordam |
| 4 — "Precisaria ajuda técnica" | Negativa | 2,29/5 | ⚠️ Bom, mas divergência — 28% concordam |

### 5.2. Observações Críticas

**Questão 4 — Ponto de Divergência**
- 28,6% (2/7) respondentes concordam que precisariam de "ajuda técnica"
- Contradiz a simplicidade percebida (Questão 2-3)
- **Possível causa**: Participantes com baixa familiaridade digital sentem insegurança mesmo em interface simples

**Recomendação**: Adicionar onboarding contextual (tooltips, wizard inicial) para usuários com perfil "baixa alfabetização digital".

### 5.3. Escore SUS Pendente ⚠️

**Questões 5-10 NÃO foram analisadas.**

Fórmula SUS completa:
```
Score = [(Q1 + Q3 + Q5 + Q7 + Q9 - 5) + (20 - Q2 - Q4 - Q6 - Q8 - Q10)] × 2,5
Score = 0–100 (não é porcentagem)
```

**Status**: Incompleto. Necessário calcular com as 10 questões para conclusão formal.

---

## 6. Gaps Identificados

### 6.1. Cenários Offline (RNF05 — Crítico)

**Problema**: Nenhuma tarefa testa aplicação **offline-first**.

| Cenário | Status | Impacto |
|---------|--------|--------|
| Registrar dado sem conexão | ❌ Não testado | Alto — core da aplicação |
| Sincronizar fila (outbox) | ❌ Não testado | Alto — RN10-RN17 |
| Conflito de sincronização | ❌ Não testado | Médio — edge case |

**Recomendação**: Adicionar Tarefas 7-8 em Sprint 6:
- **Tarefa 7**: "Capataz cria tarefa com foto **sem WiFi**, depois conecta"
- **Tarefa 8**: "Gerente consulta dados criados por Capataz offline (reprocessamento)"

### 6.2. Correlação Guerrilha ↔ SUS

**Inconsistência**: 
- Guerrilha mostra Tarefa 2 = 0% sucesso (HTTP 400 crítico)
- SUS Questão 3 diz 86% acham "fácil de usar"
- **Questão**: Quando SUS foi respondido? Antes ou depois de corrigir bugs?

**Recomendação**: Documentar timeline:
- Fase 1: Testes de guerrilha (22 sessões, 6 participantes)
- Fase 2: Correções aplicadas
- Fase 3: Testes SUS (7 respondentes) — **data?**

---

## 7. Validação contra Requisitos da Tarefa

| Critério | Status | Evidência |
|----------|--------|-----------|
| Revisar 3 enunciados completos | ✅ | 6 tarefas documentadas (2 cada perfil) |
| Verificar consistência metodológica | ✅ | Estrutura padronizada (cenário, etapas, resultados, heurísticas) |
| Validar progressão de dificuldade | ✅ | Sequência não-linear, balanceada |
| Cobrir fluxos dos 3 perfis | ✅ | Capataz, Gerente, Coordenador testados |
| Validar sem sobreposição | ✅ | Tarefas complementares, sem repetição |

**Conclusão**: Todos os critérios da tarefa original foram atendidos. ✅

---

## 8. Parecer Final

### Status: ✅ APROVAÇÃO CONDICIONAL

**Pode ser aprovado para:**
- ✅ Documentação de design (WAD)
- ✅ Validação de interface visual
- ✅ Referência em relatórios de sprint
- ✅ Baseline para testes futuros

**Requer antes da publicação final:**

1. **[OBRIGATÓRIO]** Completar análise SUS
   - Calcular escore final (0-100)
   - Interpretar com escala de Bangor et al.
   - Incluir conclusão: "Sistema atinge nível [X] de usabilidade"
   - Prazo: Antes do merge na `develop`

2. **[OBRIGATÓRIO]** Corrigir HTTP 400 em Tarefa 2
   - Revisar validação no endpoint `/api/chamados`
   - Testar com 3+ participantes pós-correção
   - Documentar fix no PR
   - Prazo: Antes do merge na `develop`

**Recomendações para Sprint 6 (não bloqueia publicação):**
- [ ] Adicionar 2 tarefas de cenário offline (Tarefas 7-8)
- [ ] Validar com usuários reais da BrPec (3-5 capatazes)
- [ ] Expandir amostra para 10-12 participantes
- [ ] Adicionar mensuração de tempo de conclusão (RNF02)

---

## 9. Próximas Ações

| Ação | Responsável | Prazo | Status |
|------|-------------|-------|--------|
| Calcular escore SUS completo | @lorena.kopke | Imediato | ⏳ Pendente |
| Corrigir endpoint `/api/chamados` | @backend-lead | Imediato | ⏳ Pendente |
| Retesta Tarefa 2 com 3+ participantes | @lorena.kopke | Após correção | ⏳ Agendado |
| Merge na `develop` | @laiza.guimaraes | Após 2 ações acima | ⏳ Aguardando |
| Planejar testes offline (Sprint 6) | @product-lead | Sprint planning S6 | 📋 Backlog |

---

## 10. Assinatura

**Revisor**: @laiza.guimaraes  
**Data**: 2026-06-23  
**Feedback Registrado em**: Esta documentação  
**Status do Card**: Aprovado com condições  

---

### Observação Final

Os enunciados são de boa qualidade metodológica. Os problemas encontrados (especialmente Tarefa 2) são **reais e reproduzíveis**, não artefatos de design ruim — indicando que os testes fizeram seu trabalho. A falta de testes offline é um **gap de escopo**, não falha da autora. 

Recomenda-se aproveitar esta base sólida para Sprint 6 com testes de usuários reais no Pantanal. 🚀
