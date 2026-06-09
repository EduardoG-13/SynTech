import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './config/swagger.json';
import express from 'express';
import cors from 'cors';
import path from 'path';
import session from 'express-session';
import { Request, Response, NextFunction } from 'express';
import db from './config/database';
import routes from './routes/index';
import viewRoutes from './routes/viewRoutes';
import authRoutes from './routes/authRoutes';

const app = express();
const projectRoot = process.cwd();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(projectRoot, 'src/views'));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(projectRoot, 'src/public')));
app.use(session({
  secret: 'brpec-syntech-2026',
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
  const retiros = db.prepare('SELECT id, nome FROM retiros ORDER BY nome').all();
  res.render('selecionar-retiro', { retiros });
});

app.get('/login-auth', (req, res) => {
  const perfil = req.query.perfil || 'Coordenador';
  res.render('login-auth', { perfil });
});

app.get('/selecionar-categoria-infra', (_req, res) => {
  res.render('selecionar-categoria-infra');
});

app.get('/dashboard', (req, res) => {
  const perfil = req.query.perfil || 'Gerente';
  const retiro = req.query.retiro || 'Geral';
  res.render('dashboard', { perfil, retiro });
});

app.get('/configuracoes', (req, res) => {
  const perfil = req.query.perfil || 'Gerente';
  const retiro = req.query.retiro || 'Geral';
  res.render('configuracoes', { perfil, retiro });
});

app.get('/tarefas', (req, res) => {
  const perfil = req.query.perfil || 'Capataz';
  const retiro = req.query.retiro || 'Geral';
  res.render('tarefas', { perfil, retiro });
});

// Rotas de autenticação
app.use('/api/auth', authRoutes);

// Service Worker servido na raiz para escopo global do PWA
app.get('/sw.js', (_req: Request, res: Response) => {
  res.sendFile(path.join(projectRoot, 'src/public/sw.js'));
});

// Rotas da API
app.use('/api', routes);

// Rotas de views adicionais
app.use('/', viewRoutes);

// Error handler global
app.use((erro: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

export default app;
