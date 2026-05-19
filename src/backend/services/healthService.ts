/**
 * services/healthService.js
 * Logica de negocio do health-check. Nao conhece HTTP.
 * node:sqlite (DatabaseSync) e sincrono -- sem async/await.
 */

import db from '../config/database';

/**
 * Verifica a saude do sistema: servidor ativo e banco acessivel.
 * @returns {Object} Objeto com status, timestamp, uptime e estado do banco.
 */
function verificarSaude() {
  let bancoStatus = 'desconectado';
  let erro = null;

  try {
    const stmt = db.prepare('SELECT 1 AS ok');
    stmt.get();
    bancoStatus = 'conectado';
  } catch (err) {
    bancoStatus = 'desconectado';
    erro = (err as Error).message;
  }

  const resultado: any = {
    status: bancoStatus === 'conectado' ? 'ok' : 'erro',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    banco: bancoStatus,
  };

  if (erro) {
    resultado.erro = erro;
  }

  return resultado;
}

export default { verificarSaude };


