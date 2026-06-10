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
import { inicializarBanco } from '../config/initDb';

beforeAll(() => {
  inicializarBanco();
});

describe('View Routes — EJS Template Rendering', () => {
  // ─────────────────────────────────────────────────────────
  // GET /
  // ─────────────────────────────────────────────────────────
  describe('GET /', () => {
    it('retorna 200 e renderiza HTML da página inicial', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toContain('BrPec');
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
      expect(res.text).toContain('Dashboard');
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

  // ─────────────────────────────────────────────────────────
  // GET /nova-boleta
  // ─────────────────────────────────────────────────────────
  describe('GET /nova-boleta', () => {
    it('retorna 200 e renderiza o formulário de boleta zootécnica', async () => {
      const res = await request(app).get('/nova-boleta?perfil=Capataz&retiro=Geral');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toContain('Nova Boleta Zootécnica');
      expect(res.text).toContain('Tipo de boleta');
      expect(res.text).toContain('Identificador do chip');
    });
  });
});
