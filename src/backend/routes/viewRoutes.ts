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
import { RETIROS } from '../config/retiros';

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
    // Página inicial (login)
    this.router.get('/', (_req: Request, res: Response) => {
      res.render('login');
    });
    // Seleção de retiro para o capataz
    this.router.get('/selecionar-retiro', (_req: Request, res: Response) => {
      res.render('selecionar-retiro', { retiros: RETIROS });
    });
    // Listagem de tarefas principal
    this.router.get('/tarefas', (req: Request, res: Response) => {
      const perfil = req.query.perfil || 'Capataz';
      const retiro = req.query.retiro || 'Geral';
      res.render('tarefas', { perfil, retiro });
    });

    // Dashboard (US07)
    this.router.get('/dashboard', (req: Request, res: Response) => {
      const perfil = req.query.perfil || 'Gerente';
      const retiro = req.query.retiro || 'Geral';
      res.render('dashboard', { title: 'BRPec | Dashboard', perfil, retiro });
    });
    // Listagem de tarefas (antigo / tasks placeholder para testes)
    this.router.get('/tasks', (_req: Request, res: Response) => {
      res.render('tasks', { title: 'BRPec | Tarefas' });
    });

    // Detalhe da tarefa (US02)
    this.router.get('/tarefa/:id', (req: Request, res: Response) => {
      const perfil = req.query.perfil || 'Capataz';
      const retiro = req.query.retiro || 'Geral';
      res.render('tarefa-detalhe', { perfil, retiro, tarefaId: req.params.id });
    });

    // Concluir tarefa (US03/US04/US05)
    this.router.get('/tarefa/:id/concluir', (req: Request, res: Response) => {
      const perfil = req.query.perfil || 'Capataz';
      const retiro = req.query.retiro || 'Geral';
      res.render('tarefa-concluir', { perfil, retiro, tarefaId: req.params.id });
    });

    // Nova Ordem de Serviço (US01)
    this.router.get('/nova-os', (req: Request, res: Response) => {
      const perfil = req.query.perfil || 'Gerente';
      const retiro = req.query.retiro || 'Geral';
      res.render('nova-os', { perfil, retiro });
    });

    // Painel de Infraestrutura (US06/US07)
    this.router.get('/infraestrutura', (req: Request, res: Response) => {
      const perfil = req.query.perfil || 'Infraestrutura';
      const retiro = req.query.retiro || 'Geral';
      res.render('infraestrutura', { perfil, retiro });
    });

    // Registrar resolução de chamado (US06)
    this.router.get('/chamado/:id/resolver', (req: Request, res: Response) => {
      const perfil = req.query.perfil || 'Infraestrutura';
      const retiro = req.query.retiro || 'Geral';
      res.render('chamado-resolver', { perfil, retiro, chamadoId: req.params.id });
    });

    // Boletas / Movimentações (US11/US12)
    this.router.get('/boletas', (req: Request, res: Response) => {
      const perfil = req.query.perfil || 'Coordenador';
      const retiro = req.query.retiro || 'Geral';
      res.render('boletas', { perfil, retiro });
    });
  }
}

export default new ViewRoutes().router;
