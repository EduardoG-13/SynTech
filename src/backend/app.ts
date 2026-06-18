import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './config/swagger.json';
import express from 'express';
import cors from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { Request, Response, NextFunction } from 'express';
import db from './config/database';
import { RETIROS } from './config/retiros';
import routes from './routes/index';
import viewRoutes from './routes/viewRoutes';
import authRoutes from './routes/authRoutes';
import { autenticarJWT } from './middleware/authMiddleware';
import { requireLogin } from './middlewares/authView';

const app = express();
// Raiz do projeto (g03/) calculada a partir deste arquivo (src/backend/app.ts),
// funciona independente de onde o servidor é executado (raiz ou src/backend)
const projectRoot = path.resolve(__dirname, '../../');

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(projectRoot, 'src/views'));

// Middleware
app.use(cors());
// Limite aumentado para 25MB para suportar foto + áudio em base64 (boletas e resoluções)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());
app.use('/public', express.static(path.join(projectRoot, 'src/public')));
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET precisa ser definido em producao');
}
app.use(session({
  secret: sessionSecret || 'brpec-syntech-dev',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 365 * 24 * 60 * 60 * 1000 }
}));

// Rota para documentação da API
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// Rotas de views (EJS)
app.get('/', (_req, res) => {
  res.render('login');
});

app.get('/selecionar-retiro', (_req, res) => {
  const retiros = db.prepare(`
    SELECT r.id, r.nome, u.nome AS capataz
    FROM retiros r
    LEFT JOIN usuarios u ON r.capataz_id = u.id
    ORDER BY r.nome
  `).all();
  res.render('selecionar-retiro', { retiros });
});

app.get('/login-auth', (req, res) => {
  const perfil = req.query.perfil || 'Coordenador';
  res.render('login-auth', { perfil });
});

app.get('/selecionar-categoria-infra', (_req, res) => {
  res.render('selecionar-categoria-infra');
});

// ====================================================================
// Rotas PROTEGIDAS — requireLogin checa sessão + perfil.
// A query string ?perfil=X é IGNORADA — o perfil vem da sessão (fonte da verdade).
// ====================================================================

app.get('/dashboard', requireLogin(['Gerente', 'Coordenador']), (_req, res) => {
  const u = (res.locals as any).usuarioLogado;
  res.render('dashboard', { perfil: u.perfil, retiro: u.retiro_id || 'Geral' });
});

app.get('/configuracoes', requireLogin(['Gerente'], { exigeAdmin: true }), (_req, res) => {
  const u = (res.locals as any).usuarioLogado;
  res.render('configuracoes', { perfil: u.perfil, retiro: u.retiro_id || 'Geral', isAdmin: u.is_admin });
});

app.get('/infraestrutura', requireLogin(['Infraestrutura', 'Gerente']), (_req, res) => {
  const u = (res.locals as any).usuarioLogado;
  res.render('infraestrutura', { perfil: u.perfil, retiro: u.retiro_id || 'Geral' });
});

app.get('/tarefas', requireLogin(['Capataz']), (_req, res) => {
  const u = (res.locals as any).usuarioLogado;
  res.render('tarefas', { perfil: u.perfil, retiro: u.retiro_id || 'Geral' });
});

app.get('/tarefa/:id', requireLogin(), (req, res) => {
  const u = (res.locals as any).usuarioLogado;
  res.render('detalhe-tarefa', { perfil: u.perfil, retiro: u.retiro_id || 'Geral', tarefaId: req.params.id });
});

// Histórico (unificado — perfis com acesso são filtrados no endpoint)
app.get('/historico', requireLogin(['Capataz', 'Infraestrutura', 'Coordenador', 'Gerente']), (_req, res) => {
  const u = (res.locals as any).usuarioLogado;
  res.render('historico', { perfil: u.perfil, retiro: u.retiro_id || 'Geral' });
});

// Detalhe de uma boleta (somente leitura) — Capataz e Coordenador
app.get('/boleta/:id', requireLogin(['Capataz', 'Coordenador', 'Gerente']), (req, res) => {
  const u = (res.locals as any).usuarioLogado;
  res.render('detalhe-boleta', { perfil: u.perfil, retiro: u.retiro_id || 'Geral', boletaId: req.params.id });
});

app.get('/nova-os', requireLogin(['Capataz']), (_req, res) => {
  const u = (res.locals as any).usuarioLogado;
  res.render('nova-os', { perfil: u.perfil, retiro: u.retiro_id || 'Geral' });
});

// Tela de sucesso após registrar (resumo do registro vem do localStorage)
app.get('/sucesso', requireLogin(), (_req, res) => {
  const u = (res.locals as any).usuarioLogado;
  res.render('sucesso', { perfil: u.perfil, retiro: u.retiro_id || 'Geral' });
});

app.get('/nova-boleta', (req, res) => {
  const perfil = req.query.perfil || 'Capataz';
  const retiro = req.query.retiro || 'Geral';
  res.render('nova-boleta', { perfil, retiro });
});

// Rotas de autenticação
app.use('/api/auth', authRoutes);

// Service Worker servido na raiz para escopo global do PWA
app.get('/manifest.json', (_req: Request, res: Response) => {
  res.sendFile(path.join(projectRoot, 'src/public/manifest.json'));
});

app.get('/sw.js', (_req: Request, res: Response) => {
  res.sendFile(path.join(projectRoot, 'src/public/sw.js'));
});

// Rotas da API
app.use('/api', autenticarJWT, routes);

// Rotas de views adicionais
app.use('/', viewRoutes);

// Error handler global
app.use((erro: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

export default app;
