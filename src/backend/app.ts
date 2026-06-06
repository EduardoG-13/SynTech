import express from 'express';
import cors from 'cors';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { RETIROS } from './config/retiros';
import routes from './routes/index';
import viewRoutes from './routes/viewRoutes';

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
