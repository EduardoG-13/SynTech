import { query } from '../database/connection';

export const checkHealth = async () => {
  let databaseStatus = 'desconectado';

  try {
    await query("SELECT datetime('now') AS now");
    databaseStatus = 'conectado';
  } catch (error) {
    databaseStatus = 'erro: ' + (error as Error).message;
  }

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: databaseStatus,
  };
};
