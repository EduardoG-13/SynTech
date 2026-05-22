import { NextFunction, Request, Response } from 'express';
import * as healthService from '../services/healthService';

export const getHealth = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const health = await healthService.checkHealth();
    return res.json(health);
  } catch (error) {
    return next(error);
  }
};
