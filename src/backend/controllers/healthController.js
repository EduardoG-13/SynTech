/**
 * controllers/healthController.js
 * Recebe a requisicao, delega para o service e retorna a resposta.
 */

const healthService = require('../services/healthService');

const getHealth = async (req, res, next) => {
  try {
    const result = await healthService.checkHealth();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getHealth };
