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
});
