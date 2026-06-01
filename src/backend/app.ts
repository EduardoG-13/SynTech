/**
 * app.ts - Configuração do Express (middlewares e rotas).
 * Separado do server.js para facilitar testes futuros.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();

// --------------- View Engine (EJS) ---------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// --------------- Middlewares ---------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, '../public')));

// --------------- Rotas ---------------
import routes from './routes/index';
app.use('/api', routes);

// --------------- View Routes ---------------
import viewRoutes from './routes/viewRoutes';
app.use('/', viewRoutes);

// --------------- Erros ---------------
// Error handler global
app.use((erro, req, res, next) => {
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

export default app;


