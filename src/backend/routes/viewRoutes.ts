/**
 * routes/viewRoutes.ts - Rotas de renderização de views EJS.
 * Mapeia as rotas GET para os templates da camada de apresentação.
 *
 * Traceabilidade:
 *   US01 - Login de capataz com acesso restrito ao retiro
 *   RF004 - Filtragem de dados por retiro
 *   BR04 - Acesso exclusivo por capataz/retiro
 */

import { Router, Request, Response } from 'express';

export class ViewRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  /**
   * Registra as rotas GET que renderizam os templates EJS.
   */
  private registerRoutes(): void {
    // Página inicial (login / homepage)
    this.router.get('/', (_req: Request, res: Response) => {
      res.render('index', { title: 'BRPec | Página Inicial' });
    });

    // Dashboard do capataz
    this.router.get('/dashboard', (_req: Request, res: Response) => {
      res.render('dashboard', { title: 'BRPec | Dashboard' });
    });

    // Listagem de tarefas
    this.router.get('/tasks', (_req: Request, res: Response) => {
      res.render('tasks', { title: 'BRPec | Tarefas' });
    });
  }
}

export default new ViewRoutes().router;
