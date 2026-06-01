/**
 * app.js - Configuração do Express (middlewares e rotas).
 * Separado do server.js para facilitar testes futuros.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
const projectRoot = process.cwd();

// --------------- Middlewares ---------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(projectRoot, 'src/public')));

// --------------- Views ---------------
app.set('view engine', 'ejs');
app.set('views', path.join(projectRoot, 'src/views'));

// --------------- Rotas ---------------
import routes from './routes/index';
app.get('/', (_req, res) => {
  res.render('index');
});

app.use('/api', routes);

export default app;


