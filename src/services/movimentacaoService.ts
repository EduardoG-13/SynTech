import crypto from 'crypto';
import { PayloadNascimento, RegistroNascimento } from '../models/Movimentacao';
import * as movimentacaoRepository from '../repositories/movimentacaoRepository';
import * as syncNotifier from './syncNotifier';

const categoriasValidas = new Set(['bezerro', 'garrote', 'boi_touro', 'bezerra', 'novilha', 'vaca']);

const createError = (message: string, statusCode: number): Error & { statusCode: number } => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
};

const ensureString = (payload: Partial<PayloadNascimento>, field: keyof PayloadNascimento): void => {
  if (!payload[field] || typeof payload[field] !== 'string') {
    throw createError(`Campo obrigatorio invalido: ${field}`, 400);
  }
};

export const registrarNascimento = async (
  payload: PayloadNascimento,
): Promise<RegistroNascimento> => {
  ensureString(payload, 'retiroId');
  ensureString(payload, 'responsavelId');
  ensureString(payload, 'categoria');
  ensureString(payload, 'dataMovimentacao');

  if (!categoriasValidas.has(payload.categoria)) {
    throw createError('Categoria de animal invalida', 400);
  }

  if (!Number.isInteger(payload.quantidade)) {
    throw createError('Campo obrigatorio invalido: quantidade', 400);
  }

  if (payload.quantidade <= 0) {
    throw createError('A quantidade de nascimentos deve ser maior que zero', 422);
  }

  const registro = movimentacaoRepository.createNascimento({
    payload,
    movimentacaoId: crypto.randomUUID(),
    nascimentoId: crypto.randomUUID(),
    syncQueueId: crypto.randomUUID(),
    retiroId: payload.retiroId,
    responsavelId: payload.responsavelId,
    categoria: payload.categoria,
    dataMovimentacao: payload.dataMovimentacao,
    observacoes: payload.observacoes,
    quantidade: payload.quantidade,
    raca: payload.raca,
  });

  if (!registro) {
    throw createError('Erro ao registrar nascimento', 500);
  }

  await syncNotifier.notifyPendingSync(registro);

  return registro;
};

export const listarNascimentos = () => {
  return movimentacaoRepository.listNascimentos();
};

export const prepararDadosDemo = () => {
  movimentacaoRepository.seedDemoData();

  return {
    retiroId: 'retiro-barra-bonita',
    responsavelId: 'usuario-capataz-1',
  };
};
