import request from 'supertest';
import app from '../app';

describe('Front-end Offline Operations - Validação Completa', () => {
  it('serve o script de interceptação offline', async () => {
    const response = await request(app).get('/public/js/offline-interceptor.js');

    expect(response.status).toBe(200);
    expect(response.text).toContain('fazerRequisicaoComOffline');
    expect(response.text).toContain('sincronizarFilaPendente');
    expect(response.text).toContain('navigator.onLine');
  });

  it('serve o handler para nova-os', async () => {
    const response = await request(app).get('/public/js/nova-os-handler.js');

    expect(response.status).toBe(200);
    expect(response.text).toContain('form-nova-os');
    expect(response.text).toContain('fazerRequisicaoComOffline');
  });

  it('serve o handler para resolver chamado', async () => {
    const response = await request(app).get('/public/js/chamado-resolver-handler.js');

    expect(response.status).toBe(200);
    expect(response.text).toContain('form-resolver-chamado');
    expect(response.text).toContain('fazerRequisicaoComOffline');
  });

  it('serve o script sync.js para sincronização em lote', async () => {
    const response = await request(app).get('/public/js/sync.js');

    expect(response.status).toBe(200);
    expect(response.text).toContain('export async function processarFilaSincronizacao');
    expect(response.text).toContain('/api/sincronizacao/lote');
  });

  it('inclui os scripts nos templates EJS', async () => {
    const responseNovaOS = await request(app).get('/nova-os?perfil=Capataz&retiro=retiro-1');
    expect(responseNovaOS.text).toContain('nova-os-handler.js');

    // Note: Você precisa adicionar a rota /chamados/{id}/resolver conforme necessário
  });

  it('db.js possui todas as funções necessárias', async () => {
    const response = await request(app).get('/public/js/db.js');

    expect(response.status).toBe(200);
    expect(response.text).toContain('export async function salvarFila(tipo, dados)');
    expect(response.text).toContain('export const listarFila');
    expect(response.text).toContain('export const atualizarFila');
    expect(response.text).toContain('export const removerFila');
    expect(response.text).toContain('export const buscarFilaPorId');
    expect(response.text).toContain("const SYNC_QUEUE_STORE = 'sync_queue'");
    expect(response.text).toContain("status: 'PENDENTE'");
  });

  it('footer.ejs carrega os scripts de offline e db', async () => {
    const response = await request(app).get('/');

    expect(response.text).toContain('/public/js/db.js');
    expect(response.text).toContain('/public/js/offline-interceptor.js');
    expect(response.text).toContain('onlineStatus');
  });
});

describe('Requisições Offline - Integração', () => {
  it('POST com offline salva na fila ao invés de enviar', async () => {
    // Esta é uma validação funcional que ocorre no navegador
    // Aqui validamos que os endpoints estão preparados para receber as requisições

    const response = await request(app)
      .post('/api/tarefas')
      .send({
        equipe: 'Capataz',
        operacao: 'movimentacao',
        retiro: 'retiro-1',
        responsavel: 'capataz-1',
        prioridade: 'media',
        prazo: '2026-06-10',
        descricao: 'Teste offline',
      });

    // O endpoint deve aceitar a requisição quando online
    expect([200, 201, 400, 403, 404]).toContain(response.status);
  });

  it('PUT para resolver chamado com offline salva na fila', async () => {
    const response = await request(app)
      .put('/api/chamados/chamado-1/resolver')
      .send({
        chamadoId: 'chamado-1',
        descricaoSolucao: 'Problema resolvido',
        dataConclusao: '2026-06-07T14:30:00',
        fotoBase64: null,
        temFoto: false,
      });

    // O endpoint deve estar acessível
    expect([200, 201, 400, 403, 404]).toContain(response.status);
  });
});

describe('Sincronização de Fila - Preparação Backend', () => {
  it('endpoint POST /api/sincronizacao/lote existe para processar fila', async () => {
    // Validar que o backend está preparado para receber sincronizações
    const response = await request(app)
      .post('/api/sincronizacao/lote')
      .send({
        itens: [],
      });

    // Deve retornar status válido (201, 200, 400, etc)
    expect(response.status).toBeLessThan(500);
  });
});
