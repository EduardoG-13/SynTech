import { NextFunction, Request, Response } from 'express';
import * as movimentacaoService from '../services/movimentacaoService';

export const registrarNascimento = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const registro = await movimentacaoService.registrarNascimento(req.body);
    return res.status(201).json(registro);
  } catch (error) {
    return next(error);
  }
};

export const listarNascimentos = (
  _req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  try {
    return res.json(movimentacaoService.listarNascimentos());
  } catch (error) {
    return next(error);
  }
};

export const prepararDemo = (
  _req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  try {
    return res.json(movimentacaoService.prepararDadosDemo());
  } catch (error) {
    return next(error);
  }
};
