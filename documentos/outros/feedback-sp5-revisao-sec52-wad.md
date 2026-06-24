# Feedback — Revisão da Seção 5.2 do WAD (Testes de Usabilidade)

## Conclusão

A seção 5.2 está **completa e correta**. O conteúdo cobre as duas frentes previstas (testes de guerrilha e SUS), os dados são internamente consistentes, e a metodologia está bem fundamentada com referências normativas (ISO 9241-11:2018) e bibliográficas (Brooke, Bangor et al.).

## O que está bem

- **Estrutura**: introdução geral → 5.2.1 guerrilha → 5.2.2 SUS segue ordem lógica e progressiva.
- **Testes de guerrilha**: 6 tarefas documentadas com cenário, etapas esperadas, resultados individuais por participante e heurísticas relacionadas. Os dados da tabela de síntese (22 sessões, taxa de conclusão por tarefa) batem com os resultados detalhados.
- **Resultado crítico registrado corretamente**: a Tarefa 2 (Capataz — Abrir Chamado de Infraestrutura) registra 0/3 de sucesso por erro HTTP 400. O bug é real e estava presente no momento dos testes; a documentação é precisa.
- **Testes SUS**: escore 77,5 ("Bom") está documentado com os dados brutos por questão e por participante, permitindo rastreabilidade total do cálculo.
- **Triangulação**: os achados do guerrilha (H1, H9) são referenciados nos resultados SUS, criando coerência entre as duas abordagens.

## Pontos menores

- **Link quebrado** (5.2.1): o link para a planilha do Google Sheets tem um espaço entre `]` e `(`, o que impede a renderização como hiperlink em Markdown.
- **Divergência de participantes não explicada**: o guerrilha usou 6 participantes (P1–P6); o SUS usou 7 (P1–P7). A seção 5.2.2 não esclarece se P7 é um participante adicional ou se os grupos são distintos. Uma frase de contextualização resolveria a ambiguidade.

Nenhum dos dois pontos compromete a validade ou completude da seção.
