/**
 * Testes de integração das View Routes (EJS).
 * Valida que as rotas GET /, /dashboard e /tasks retornam HTTP 200
 * e renderizam HTML com o conteúdo esperado dos templates EJS.
 *
 * Traceabilidade:
 *   US01 - Login de capataz com acesso restrito ao retiro
 *   RF004 - Filtragem de dados por retiro
 *   BR04 - Acesso exclusivo por capataz/retiro
 */

import request from 'supertest';
import app from '../app';

describe('View Routes — EJS Template Rendering', () => {
  // ─────────────────────────────────────────────────────────
  // GET /
  // ─────────────────────────────────────────────────────────
  describe('GET /', () => {
    it('retorna 200 e renderiza HTML da página inicial', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toContain('BRPec');
    });
  });

  // ─────────────────────────────────────────────────────────
  // GET /dashboard
  // ─────────────────────────────────────────────────────────
  describe('GET /dashboard', () => {
    it('retorna 200 e renderiza HTML do dashboard', async () => {
      const res = await request(app).get('/dashboard');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toContain('Dashboard do Capataz');
    });
  });

  // ─────────────────────────────────────────────────────────
  // GET /tasks
  // ─────────────────────────────────────────────────────────
  describe('GET /tasks', () => {
    it('retorna 200 e renderiza HTML da lista de tarefas', async () => {
      const res = await request(app).get('/tasks');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toContain('Tarefas do Retiro');
    });
  });
});
