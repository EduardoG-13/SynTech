import { Request, Response } from 'express';
import adminService from '../services/adminService';

// ==================== RETIROS ====================

export function listarRetiros(_req: Request, res: Response) {
  try {
    const retiros = adminService.listarRetiros();
    return res.json(retiros);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
}

export function criarRetiro(req: Request, res: Response) {
  try {
    const id = adminService.criarRetiro(req.body);
    return res.status(201).json({ id, mensagem: 'Retiro criado com sucesso.' });
  } catch (error: any) {
    return res.status(400).json({ erro: error.message });
  }
}

export function atualizarRetiro(req: Request, res: Response) {
  const id = String(req.params.id);
  try {
    adminService.atualizarRetiro(id, req.body);
    return res.json({ mensagem: 'Retiro atualizado com sucesso.' });
  } catch (error: any) {
    if (error.message === 'Retiro não encontrado.') {
      return res.status(404).json({ erro: error.message });
    }
    return res.status(400).json({ erro: error.message });
  }
}

export function excluirRetiro(req: Request, res: Response) {
  const id = String(req.params.id);
  try {
    adminService.excluirRetiro(id);
    return res.json({ mensagem: 'Retiro excluído com sucesso.' });
  } catch (error: any) {
    if (error.message === 'Retiro não encontrado.') {
      return res.status(404).json({ erro: error.message });
    }
    return res.status(400).json({ erro: error.message });
  }
}

// ==================== USUÁRIOS ====================

export function listarUsuarios(req: Request, res: Response) {
  const perfil = req.query.perfil ? String(req.query.perfil) : undefined;
  try {
    const usuarios = adminService.listarUsuarios(perfil);
    return res.json(usuarios);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
}

export function criarUsuario(req: Request, res: Response) {
  try {
    const id = adminService.criarUsuario(req.body);
    return res.status(201).json({ id, mensagem: 'Usuário criado com sucesso.' });
  } catch (error: any) {
    if (error.message.includes('Já existe')) {
      return res.status(409).json({ erro: error.message });
    }
    return res.status(400).json({ erro: error.message });
  }
}

export function atualizarUsuario(req: Request, res: Response) {
  const id = String(req.params.id);
  try {
    adminService.atualizarUsuario(id, req.body);
    return res.json({ mensagem: 'Usuário atualizado com sucesso.' });
  } catch (error: any) {
    if (error.message === 'Usuário não encontrado.') return res.status(404).json({ erro: error.message });
    if (error.message.includes('Não é possível remover')) return res.status(422).json({ erro: error.message });
    return res.status(400).json({ erro: error.message });
  }
}

export function excluirUsuario(req: Request, res: Response) {
  const id = String(req.params.id);
  try {
    adminService.excluirUsuario(id);
    return res.json({ mensagem: 'Usuário excluído com sucesso.' });
  } catch (error: any) {
    if (error.message === 'Usuário não encontrado.') return res.status(404).json({ erro: error.message });
    if (error.message.includes('Não é possível excluir')) return res.status(422).json({ erro: error.message });
    return res.status(400).json({ erro: error.message });
  }
}

// ==================== EXCLUSÃO DE REGISTROS (admin only) ====================

export function excluirBoleta(req: Request, res: Response) {
  const idOuGrupo = String(req.params.grupo_id);
  try {
    const linhas = adminService.excluirBoleta(idOuGrupo);
    return res.json({ mensagem: 'Boleta excluída com sucesso.', linhas_apagadas: linhas });
  } catch (error: any) {
    if (error.message === 'Boleta não encontrada.') {
      return res.status(404).json({ erro: error.message });
    }
    return res.status(400).json({ erro: error.message });
  }
}

export function excluirChamado(req: Request, res: Response) {
  const id = String(req.params.id);
  try {
    adminService.excluirChamado(id);
    return res.json({ mensagem: 'Chamado excluído com sucesso.' });
  } catch (error: any) {
    if (error.message === 'Chamado não encontrado.') {
      return res.status(404).json({ erro: error.message });
    }
    return res.status(400).json({ erro: error.message });
  }
}

export function excluirTarefa(req: Request, res: Response) {
  const id = String(req.params.id);
  try {
    adminService.excluirTarefa(id);
    return res.json({ mensagem: 'Tarefa excluída com sucesso.' });
  } catch (error: any) {
    if (error.message === 'Tarefa não encontrada.') {
      return res.status(404).json({ erro: error.message });
    }
    return res.status(400).json({ erro: error.message });
  }
}
