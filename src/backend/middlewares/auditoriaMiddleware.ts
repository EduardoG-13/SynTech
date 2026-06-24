import { Request, Response, NextFunction } from 'express';
import auditoriaService from '../services/auditoriaService';

function inferirAcao(method: string) {
  if (method === 'POST') return 'criação';
  if (method === 'PUT' || method === 'PATCH') return 'edição';
  if (method === 'DELETE') return 'exclusão';
  return 'acesso';
}

function inferirEntidade(path: string) {
  if (path.includes('/boletas')) return 'boleta';
  if (path.includes('/chamados')) return 'chamado';
  if (path.includes('/tarefas')) return 'tarefa';
  if (path.includes('/retiros')) return 'retiro';
  if (path.includes('/usuarios')) return 'usuario';
  if (path.includes('/sincronizacao')) return 'sincronizacao';
  if (path.includes('/dispositivos')) return 'dispositivo';
  return 'sistema';
}

export function auditoriaMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  if (req.path.includes('/admin/auditoria')) return next();

  res.on('finish', () => {
    const usuario = (req.session as any)?.usuario;
    auditoriaService.registrar({
      usuario_id: usuario?.id || null,
      usuario_nome: usuario?.nome || null,
      perfil: usuario?.perfil || null,
      acao: inferirAcao(req.method),
      entidade_tipo: inferirEntidade(req.path),
      entidade_id: req.params?.id || req.params?.grupo_id || req.body?.id || req.body?.grupo_id || null,
      metodo: req.method,
      rota: req.originalUrl,
      status_http: res.statusCode,
      detalhes: {
        offlineSync: req.path.includes('/sincronizacao'),
        sucesso: res.statusCode < 400,
      },
    });
  });

  next();
}
