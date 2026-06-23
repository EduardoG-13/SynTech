# Relatório de Cobertura — [SP5] Validar cobertura e executar suite completa

## Resultado Geral

| Métrica | Resultado |
|---|---|
| Suites executadas | 26 |
| Suites passando | 26 |
| Suites com falha | 0 |
| Testes passando | 206 |
| Testes falhando | 0 |

**Todas as 26 suites passam. 206 testes passando.** A falha de compilação em `cloudSyncService.ts` (`Cannot find name 'db'`) foi corrigida com a adição do import faltante.

---

## Cobertura — Áreas Críticas

### Autenticação (`auth`)

| Arquivo | Statements | Branch | Funções |
|---|---|---|---|
| `authController.ts` | 55.4% | 35.7% | 61.5% |
| `authService.ts` | 52.9% | 40.0% | 33.3% |
| `refreshTokenRepository.ts` | 92.8% | 100% | 83.3% |

### Sincronização (`sync`)

| Arquivo | Statements | Branch | Funções |
|---|---|---|---|
| `sincronizacaoService.ts` | 63.2% | 31.4% | 80.0% |
| `sincronizacaoRepository.ts` | 40.0% | 24.0% | 66.6% |
| `cloudSyncService.ts` | 88.5% | 85.0% | 25.0% |

### Eventos Zootécnicos (`eventos`)

| Arquivo | Statements | Branch | Funções |
|---|---|---|---|
| `eventoController.ts` | 80.0% | 60.0% | 66.6% |
| `eventoService.ts` | 89.4% | 66.6% | 100% |
| `eventoRepository.ts` | 45.8% | 13.6% | 75.0% |

---

## Cobertura Global

| Statements | Branch | Funções | Linhas |
|---|---|---|---|
| 45.2% | 24.3% | 32.1% | 47.7% |

---

## Observações

- **Eventos** é a área com melhor cobertura. Service e controller bem testados.
- **Auth** tem cobertura parcial: `refreshTokenRepository` está bem coberto, mas os fluxos de `refresh`, `loginCapataz` e `loginInfraestrutura` em `authController` não têm testes.
- **Sync** tem lacunas relevantes: `sincronizacaoRepository` cobre apenas 40%. `cloudSyncService` agora compila e está com 88.5% de statements.
- **`boletaService.ts`** (área crítica da sprint): 3.8% de cobertura, sem testes dedicados.
