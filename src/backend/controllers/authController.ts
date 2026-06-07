import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/database';

export function login(req: Request, res: Response) {
  const { usuario, senha, perfil } = req.body;

  if (!usuario || !senha || !perfil) {
    return res.status(400).json({ sucesso: false, erro: 'Campos obrigatórios não preenchidos.' });
  }

  const row = db.prepare('SELECT * FROM usuarios WHERE nome = ? AND perfil = ?').get(usuario, perfil) as any;

  if (!row) {
    return res.status(401).json({ sucesso: false, erro: 'Usuário não encontrado.' });
  }

  const senhaValida = bcrypt.compareSync(senha, row.senha);

  if (!senhaValida) {
    return res.status(401).json({ sucesso: false, erro: 'Senha incorreta.' });
  }

  (req.session as any).usuario = {
    id: row.id,
    nome: row.nome,
    perfil: row.perfil,
    retiro_id: row.retiro_id,
  };

  return res.json({ sucesso: true, perfil: row.perfil });
}

export function logout(req: Request, res: Response) {
  req.session.destroy(() => {
    res.json({ sucesso: true });
  });
}
