/**
 * smoke-test.ts — Script efêmero de sanity check pós-refatoração.
 * Valida que todas as rotas registradas no Express respondem (não 404).
 * SERÁ DELETADO após execução.
 */

import app from './src/backend/app';
import { inicializarBanco } from './src/backend/config/initDb';

inicializarBanco();

const PORT = 3005;

interface RouteTest {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  body?: Record<string, any>;
}

const rotas: RouteTest[] = [
  { method: 'GET',   path: '/api/health' },
  { method: 'POST',  path: '/api/tarefas', body: {} },
  { method: 'GET',   path: '/api/tarefas/hoje' },
  { method: 'PATCH', path: '/api/tarefas/fake-id-000/concluir', body: {} },
  { method: 'POST',  path: '/api/tarefas/fake-id-000/evidencias', body: {} },
  { method: 'POST',  path: '/api/chamados', body: {} },
  { method: 'GET',   path: '/api/painel-gerencial' },
  { method: 'GET',   path: '/api/eventos-zootecnicos' },
  { method: 'POST',  path: '/api/eventos-zootecnicos/nascimentos', body: {} },
  { method: 'POST',  path: '/api/eventos-zootecnicos/obitos', body: {} },
  { method: 'POST',  path: '/api/sincronizacao/lote', body: {} },
  { method: 'GET',   path: '/api/exportacao/csv' },
];

async function run() {
  const server = app.listen(PORT, async () => {
    console.log(`[smoke] Servidor de teste na porta ${PORT}`);
    const resultados: { rota: string; method: string; status: number; ok: boolean }[] = [];

    for (const rota of rotas) {
      try {
        const url = `http://localhost:${PORT}${rota.path}`;
        const options: RequestInit = {
          method: rota.method,
          headers: { 'Content-Type': 'application/json' },
        };
        if (rota.body !== undefined) {
          options.body = JSON.stringify(rota.body);
        }
        const res = await fetch(url, options);
        const is404 = res.status === 404;
        resultados.push({
          rota: rota.path,
          method: rota.method,
          status: res.status,
          ok: !is404,
        });
      } catch (err: any) {
        resultados.push({
          rota: rota.path,
          method: rota.method,
          status: -1,
          ok: false,
        });
      }
    }

    // Imprimir resultado
    console.log('\n====== SMOKE TEST RESULTS ======');
    let falhas = 0;
    for (const r of resultados) {
      const emoji = r.ok ? 'PASS' : 'FAIL';
      console.log(`[${emoji}] ${r.method.padEnd(5)} ${r.rota.padEnd(50)} -> HTTP ${r.status}`);
      if (!r.ok) falhas++;
    }
    console.log(`\nTotal: ${resultados.length} | Passou: ${resultados.length - falhas} | Falhou: ${falhas}`);
    console.log('================================\n');

    server.close(() => process.exit(falhas > 0 ? 1 : 0));
  });
}

run();
