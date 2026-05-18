/**
 * app.js - Configuração do Express (middlewares e rotas).
 * Separado do server.js para facilitar testes futuros.
 */

const express = require('express');
const cors = require('cors');

const app = express();

// --------------- Middlewares ---------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------- Rotas ---------------
const routes = require('./routes/index');
app.use('/api', routes);

module.exports = app;
