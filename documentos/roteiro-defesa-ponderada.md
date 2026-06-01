# Roteiro curto para defesa da ponderada

## 1. Abertura

"Eu tratei a entrega como rastreabilidade real, nao como uma lista de promessas. A matriz
mostra o que esta implementado, a evidencia concreta e o que ainda esta parcial ou
pendente."

## 2. Numeros principais

- 3 personas: Gerente, Capataz e Coordenador.
- 5 RFs na trilha principal e cobertura ampliada dos demais endpoints.
- 15 linhas RF + RN sem celulas vazias.
- 8 RNFs revisitados.
- 7 mudancas de contrato registradas.
- 13 evidencias localizadas.
- 41 testes aprovados em 4 suites.
- Build TypeScript aprovado.

## 3. Demonstracoes fortes

1. Abrir `documentos/entrega-ponderada-rastreabilidade.md`.
2. Mostrar a RTM principal e explicar uma linha atendida, uma parcial e uma pendente.
3. Mostrar `src/backend/__tests__/contratos-rnf.test.ts`.
4. Executar:

```bash
npm test -- --runInBand
npm run build
```

5. Destacar a correcao de RN28: somente movimentacoes com `validado = 1` entram no CSV.
6. Destacar o teste de desempenho com 1.000 tarefas e limite de 2 segundos.

## 4. Como responder sobre pendencias

**Pergunta:** O sistema ja funciona totalmente offline?

**Resposta:** "O backend ja recebe lotes, usa transacoes e registra resultados de
sincronizacao. A camada client-side com IndexedDB e Service Worker continua declarada
como pendente. Eu separei modelagem de evidencia executavel para nao afirmar algo que
ainda nao foi comprovado."

**Pergunta:** Por que nao ha autenticacao?

**Resposta:** "A arquitetura atual documenta uma decisao de simplificacao do MVP. Isso
diverge da Ponderada I, por isso registrei a mudanca de contrato como MC01 e classifiquei
seguranca e auditabilidade como parciais. Para producao, autenticacao e autorizacao
centralizadas sao obrigatorias."

**Pergunta:** O que mudou durante a atividade?

**Resposta:** "Corrigi a exportacao para respeitar RN28, adicionei constraint de status,
unifiquei as suites Jest, inclui testes de capacidade e desempenho e garanti build
reproduzivel."

