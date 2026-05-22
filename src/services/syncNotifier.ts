import { RegistroNascimento } from '../models/Movimentacao';

export const notifyPendingSync = async (_registro: RegistroNascimento) => {
  return { queued: true };
};
