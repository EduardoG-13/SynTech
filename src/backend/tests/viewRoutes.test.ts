/**
 * Testes de integração das View Routes (EJS).
 *
 * Atualizado para refletir o sistema atual:
 *  - Rotas protegidas por requireLogin redirecionam (302) sem sessão.
 *  - Rota pública / renderiza a tela de seleção de perfil.
 *  - Rotas /tarefas, /dashboard etc. exigem sessão — sem ela, 302.
 *
 * Traceabilidade:
 *   US01 - Seleção de perfil + login com retiro/categoria
 *   RF004 - Filtragem de dados por retiro (validado nos endpoints, não na view)
 *   RNF-Segurança - Acesso a rotas internas exige sessão server-side
 */

import request from 'supertest';
import app from '../app';
import { inicializarBanco } from '../config/initDb';

beforeAll(() => {
  inicializarBanco();
});

describe('View Routes — EJS Template Rendering', () => {
  describe('GET /', () => {
    it('renderiza a tela de seleção de perfil (rota pública)', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      // A tela inicial mostra a marca Syntech e os 4 perfis
      expect(res.text).toMatch(/Syntech|perfil|Capataz/i);
    });
  });

  describe('GET /dashboard sem sessão', () => {
    it('redireciona para / quando não há sessão', async () => {
      const res = await request(app).get('/dashboard');
      // requireLogin → redirect 302 pra raiz
      expect([302, 303]).toContain(res.status);
      expect(res.headers.location).toBe('/');
    });
  });

  describe('GET /tarefas sem sessão', () => {
    it('redireciona para / quando não há sessão (rota do Capataz)', async () => {
      const res = await request(app).get('/tarefas');
      expect([302, 303]).toContain(res.status);
      expect(res.headers.location).toBe('/');
    });
  });

  describe('GET /nova-os sem sessão', () => {
    it('redireciona para / quando não há sessão', async () => {
      const res = await request(app).get('/nova-os');
      expect([302, 303]).toContain(res.status);
      expect(res.headers.location).toBe('/');
    });
  });

  describe('GET /historico sem sessão', () => {
    it('redireciona para / quando não há sessão', async () => {
      const res = await request(app).get('/historico');
      expect([302, 303]).toContain(res.status);
      expect(res.headers.location).toBe('/');
    });
  });

  describe('GET /configuracoes sem sessão', () => {
    it('redireciona para / quando não há sessão (rota admin)', async () => {
      const res = await request(app).get('/configuracoes');
      expect([302, 303]).toContain(res.status);
      expect(res.headers.location).toBe('/');
    });
  });

  describe('GET /selecionar-retiro', () => {
    it('renderiza a tela de seleção de retiro (rota pública)', async () => {
      const res = await request(app).get('/selecionar-retiro');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });
  });
});
