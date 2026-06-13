import request from 'supertest';
import app from '../app';

describe('Front-end offline IndexedDB setup', () => {
  it('renderiza a pagina inicial com o script do IndexedDB', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('/public/js/db.js');
  });

  it('serve o script que inicializa o banco local brpec_local', async () => {
    const response = await request(app).get('/public/js/db.js');

    expect(response.status).toBe(200);
    expect(response.text).toContain("const DB_NAME = 'brpec_local'");
    expect(response.text).toContain("const SYNC_QUEUE_STORE = 'sync_queue'");
    expect(response.text).toContain('indexedDB.open(DB_NAME, DB_VERSION)');
    expect(response.text).toContain("db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id', autoIncrement: true })");
  });

  it('serve a funcao salvarFila para registrar operacoes offline pendentes', async () => {
    const response = await request(app).get('/public/js/db.js');

    expect(response.status).toBe(200);
    expect(response.text).toContain('export async function salvarFila(tipo, dados)');
    expect(response.text).toContain("const tiposPermitidos = ['tarefa', 'obito', 'nascimento', 'chamado']");
    expect(response.text).toContain("status: 'PENDENTE'");
    expect(response.text).toContain('timestamp: new Date().toISOString()');
    expect(response.text).toContain("return executarNaFila('readwrite', (store) => store.add(registro))");
    expect(response.text).toContain('salvarFila,');
  });

});
