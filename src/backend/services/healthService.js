/**
 * services/healthService.js
 * Logica de negocio do health-check. Nao conhece HTTP.
 */

const db = require('../config/database');

const checkHealth = async () => {
  let databaseStatus = 'desconectado';

  try {
    await db.query('SELECT NOW()');
    databaseStatus = 'conectado';
  } catch (error) {
    databaseStatus = 'erro: ' + error.message;
  }

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: databaseStatus,
  };
};

module.exports = { checkHealth };
