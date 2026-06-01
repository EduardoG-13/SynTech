/**
 * app.ts - Configuração do Express (middlewares e rotas).
 * Separado do server.js para facilitar testes futuros.
 */

import express from 'express';
import cors from 'cors';

const app = express();

// --------------- Middlewares ---------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------- Rotas ---------------
import routes from './routes/index';
app.use('/api', routes);

// --------------- Erros ---------------
// Error handler global
app.use((erro, req, res, next) => {
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});
export default app;