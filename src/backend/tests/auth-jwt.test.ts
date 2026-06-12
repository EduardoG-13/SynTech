import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../app';
import { inicializarBanco } from '../config/initDb';
import db from '../config/database';

const USUARIO_ID = 'usuario-auth-jwt';

beforeAll(() => {
  inicializarBanco();
});

beforeEach(() => {
  process.env.AUTH_ENFORCE_IN_TEST = 'false';

  db.exec(`
    DELETE FROM refresh_tokens;
    DELETE FROM usuarios;
  `);

  db.prepare('INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)')
    .run(USUARIO_ID, 'admin-jwt', bcrypt.hashSync('123456', 10), 'Gerente', null);
});

afterEach(() => {
  process.env.AUTH_ENFORCE_IN_TEST = 'false';
});

describe('Autenticacao JWT', () => {
  test('login retorna access token e define refresh token em cookie httpOnly', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin-jwt', senha: '123456', perfil: 'Gerente' });

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.usuario).toMatchObject({
      id: USUARIO_ID,
      nome: 'admin-jwt',
      perfil: 'Gerente',
    });
    expect(res.headers['set-cookie'][0]).toContain('refreshToken=');
    expect(res.headers['set-cookie'][0]).toContain('HttpOnly');

    const tokens = db.prepare('SELECT * FROM refresh_tokens WHERE usuario_id = ?').all(USUARIO_ID);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toHaveProperty('token_hash');
  });

  test('refresh emite novo access token quando o refresh token e valido', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin-jwt', senha: '123456', perfil: 'Gerente' });

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', login.headers['set-cookie']);

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.accessToken).toBeDefined();

    const tokens = db.prepare('SELECT * FROM refresh_tokens WHERE usuario_id = ?').all(USUARIO_ID) as any[];
    expect(tokens).toHaveLength(2);
    expect(tokens.filter((token) => token.revoked_at !== null)).toHaveLength(1);
  });

  test('rota protegida rejeita requisicao sem access token quando autenticacao esta ativa', async () => {
    process.env.AUTH_ENFORCE_IN_TEST = 'true';

    const res = await request(app).get('/api/tarefas/hoje?capataz_id=qualquer');

    expect(res.status).toBe(401);
    expect(res.body.erro).toMatch(/Token de acesso ausente/);
  });

  test('rota protegida aceita access token valido quando autenticacao esta ativa', async () => {
    process.env.AUTH_ENFORCE_IN_TEST = 'true';

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin-jwt', senha: '123456', perfil: 'Gerente' });

    const res = await request(app)
      .get('/api/tarefas/hoje?capataz_id=qualquer')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    expect(res.status).not.toBe(401);
  });
});
