# Relatorio Laiza

## Evidencia do teste de erro

O teste abaixo valida o caso de erro em que a persistencia no banco real viola uma chave estrangeira. O resultado mostra que a suite Jest em TypeScript executou o caso filtrado e passou com sucesso.

![Output do teste de erro no terminal](./assets/relatorio-laiza-teste-erro.png)

## Comando executado

```bash
npm test -- -t "retorna erro quando a persistencia viola uma chave estrangeira do banco real"
```

## Resultado observado

- Suite executada: `src/tests/movimentacaoNascimento.test.ts`
- Caso validado: erro de persistencia por chave estrangeira invalida
- Resultado: `1 passed`
- Demais casos: ignorados pelo filtro `-t`
