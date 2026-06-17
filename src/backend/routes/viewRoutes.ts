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
import { checkRoleRedirect } from '../middleware/roleMiddleware';

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
      const usuario_id = (req.session as any)?.usuario?.id ?? null;
      res.render('dashboard', { title: 'BRPec | Dashboard', perfil, retiro, usuario_id });
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

    // Novo Chamado de Infraestrutura (US03 / US06)
    this.router.get('/novo-chamado', (req: Request, res: Response) => {
      const sess = (req.session as any)?.usuario;
      if (!sess) return res.redirect('/');
      const perfil = sess.perfil;
      const capataz_id = sess.id;
      const retiro_id = sess.retiro_id || '';
      const retiro = sess.retiro_id || 'Geral';
      const nome = sess.nome || '';
      res.render('novo-chamado', { perfil, retiro, capataz_id, retiro_id, nome });
    });

    // Painel de Infraestrutura (US06/US07)
    this.router.get('/infraestrutura', (req: Request, res: Response) => {
      const perfil = req.query.perfil || 'Infraestrutura';
      const retiro = req.query.retiro || 'Geral';
      res.render('infraestrutura', { perfil, retiro });
    });

    // Registrar resolução de chamado (US06) — só Infra ou Tecnico
    this.router.get('/chamado/:id/resolver', checkRoleRedirect(['Infraestrutura', 'Tecnico'], '/chamado/:id'), (req: Request, res: Response) => {
      const sess = (req.session as any)?.usuario;
      res.render('chamado-resolver', { perfil: sess.perfil, retiro: sess.retiro_id || 'Geral', nome: sess.nome || '', chamadoId: req.params.id });
    });

    // Tela read-only de chamado (Gerente, Coordenador, Capataz)
    this.router.get('/chamado/:id', (req: Request, res: Response) => {
      const sess = (req.session as any)?.usuario;
      if (!sess) return res.redirect('/');
      res.render('chamado-detalhe', { perfil: sess.perfil, retiro: sess.retiro_id || 'Geral', nome: sess.nome || '', chamadoId: req.params.id });
    });

    // Boletas / Movimentações — exclusivo do Coordenador (US11/US12)
    this.router.get('/boletas', checkRoleRedirect(['Coordenador']), (req: Request, res: Response) => {
      const sess = (req.session as any)?.usuario;
      res.render('boletas', { perfil: sess.perfil, retiro: sess.retiro_id || 'Geral', nome: sess.nome || '' });
    });

    // Nova boleta zootécnica (US05/RF007)
    this.router.get('/nova-boleta', (req: Request, res: Response) => {
      const perfil = req.query.perfil || 'Capataz';
      const retiro = req.query.retiro || 'Geral';
      res.render('nova-boleta', { perfil, retiro });
    });
  }
}

export default new ViewRoutes().router;
