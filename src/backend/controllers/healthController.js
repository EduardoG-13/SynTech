/**
 * controllers/healthController.js
 * Endpoint de verificacao de saude do sistema.
 */

const healthService = require('../services/healthService');

/**
 * GET /api/health
 * Retorna o status do servidor e a conectividade com o banco.
 */
function verificarSaude(req, res) {
  const resultado = healthService.verificarSaude();

  if (resultado.status === 'ok') {
    return res.status(200).json(resultado);
  }

  return res.status(503).json(resultado);
}

module.exports = { verificarSaude };
