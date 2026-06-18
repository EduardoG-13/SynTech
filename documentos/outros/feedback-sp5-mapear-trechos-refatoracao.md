# Feedback: [SP5] - Mapear trechos do backend para refatoração

Mapeamento bem feito. Auth e boletas como prioritários está correto, pois são os fluxos mais críticos e tinham o maior acoplamento.

Um trecho não coberto: `boletaService.ts` ficou com acesso direto ao banco (`db.prepare()` inline para todas as operações de movimentações), enquanto o fluxo de auth ganhou repositórios dedicados. Candidato a `movimentacaoRepository` numa próxima sprint para fechar a consistência de camadas.
