/**
 * routes/index.js - Agregador de rotas da API.
 */

const express = require('express');
const router = express.Router();

const healthController = require('../controllers/healthController');

// Health-check
router.get('/health', healthController.verificarSaude);

module.exports = router;
