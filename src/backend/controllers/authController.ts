import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v7 as uuidv7 } from 'uuid';
import { authConfig, JwtRefreshPayload, JwtUserPayload } from '../config/auth';
import authService from '../services/authService';
import {
  buscarRefreshTokenAtivo,
  revogarRefreshToken,
  revogarRefreshTokenPorToken,
  salvarRefreshToken,
  tokenEstaExpirado,
} from '../repositories/refreshTokenRepository';

function gerarAccessToken(usuario: JwtUserPayload) {
  return jwt.sign(usuario, authConfig.accessSecret, {
    expiresIn: authConfig.accessTokenExpiresIn,
  });
}

function calcularExpiracaoRefreshToken() {
  return new Date(Date.now() + authConfig.refreshCookieMaxAgeMs);
}

function gerarRefreshToken(usuario: JwtUserPayload, tokenId: string) {
  return jwt.sign({ ...usuario, jti: tokenId }, authConfig.refreshSecret, {
    expiresIn: authConfig.refreshTokenExpiresIn,
  });
}

function definirRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(authConfig.refreshCookieName, refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: authConfig.refreshCookieMaxAgeMs,
  });
}

function criarSessao(req: Request, usuario: JwtUserPayload) {
  (req.session as any).usuario = {
    id: usuario.id,
    nome: usuario.nome,
    perfil: usuario.perfil,
    retiro_id: usuario.retiro_id,
    is_admin: usuario.is_admin,
    categoria: usuario.categoria,
  };
}

function emitirTokens(res: Response, usuario: JwtUserPayload) {
  const refreshTokenId = uuidv7();
  const accessToken = gerarAccessToken(usuario);
  const refreshToken = gerarRefreshToken(usuario, refreshTokenId);

  salvarRefreshToken({
    id: refreshTokenId,
    usuarioId: usuario.id,
    token: refreshToken,
    expiresAt: calcularExpiracaoRefreshToken(),
  });

  definirRefreshCookie(res, refreshToken);

  return { accessToken, refreshToken };
}

export function login(req: Request, res: Response) {
  const { usuario, senha, perfil } = req.body;

  if (!usuario || !senha || !perfil) {
    return res.status(400).json({ sucesso: false, erro: 'Campos obrigatórios não preenchidos.' });
  }

  try {
    const usuarioAutenticado = authService.autenticar(usuario, senha, perfil);
    
    criarSessao(req, usuarioAutenticado);
    const { accessToken } = emitirTokens(res, usuarioAutenticado);

    return res.json({
      sucesso: true,
      perfil: usuarioAutenticado.perfil,
      is_admin: usuarioAutenticado.is_admin,
      usuario: usuarioAutenticado,
      accessToken,
    });
  } catch (error: any) {
    return res.status(401).json({ sucesso: false, erro: error.message });
  }
}

export function refresh(req: Request, res: Response) {
  const token = req.cookies?.[authConfig.refreshCookieName];

  if (!token) {
    return res.status(401).json({ sucesso: false, erro: 'Refresh token ausente.' });
  }

  try {
    const payload = jwt.verify(token, authConfig.refreshSecret) as JwtRefreshPayload;

    if (!payload.jti) {
      res.clearCookie(authConfig.refreshCookieName);
      return res.status(401).json({ sucesso: false, erro: 'Refresh token sem identificador.' });
    }

    const tokenSalvo = buscarRefreshTokenAtivo(payload.jti, token);

    if (!tokenSalvo || tokenEstaExpirado(tokenSalvo)) {
      res.clearCookie(authConfig.refreshCookieName);
      return res.status(401).json({ sucesso: false, erro: 'Refresh token revogado ou expirado.' });
    }

    const usuario: JwtUserPayload = {
      id: payload.id,
      nome: payload.nome,
      perfil: payload.perfil,
      retiro_id: payload.retiro_id,
      is_admin: payload.is_admin,
      categoria: payload.categoria,
    };

    revogarRefreshToken(payload.jti);

    criarSessao(req, usuario);
    const { accessToken } = emitirTokens(res, usuario);

    return res.json({ sucesso: true, accessToken, usuario });
  } catch {
    res.clearCookie(authConfig.refreshCookieName);
    return res.status(401).json({ sucesso: false, erro: 'Refresh token invalido ou expirado.' });
  }
}

export function logout(req: Request, res: Response) {
  const token = req.cookies?.[authConfig.refreshCookieName];

  if (token) {
    revogarRefreshTokenPorToken(token);
  }

  res.clearCookie(authConfig.refreshCookieName);
  req.session.destroy(() => {
    res.json({ sucesso: true });
  });
}

// GET /api/auth/me — retorna a sessão atual (ou null), usado pra evitar redirect loop no login
export function me(req: Request, res: Response) {
  const usuario = (req.session as any)?.usuario;
  return res.json({ usuario: usuario || null });
}

/**
 * Login simples do Capataz: ele só escolhe o retiro (sem senha por enquanto).
 * Cria sessão com perfil Capataz + retiro escolhido.
 *
 * TODO (segurança): substituir por leitura de QR code colocado no retiro,
 * onde o token assinado garante que a sessão só nasce daquele dispositivo
 * autorizado. Por ora, basta o registro do retiro no servidor.
 */
export function loginCapataz(req: Request, res: Response) {
  const { retiro_id } = req.body;
  if (!retiro_id) {
    return res.status(400).json({ sucesso: false, erro: 'retiro_id obrigatório' });
  }

  try {
    const usuarioAutenticado = authService.autenticarCapataz(retiro_id);

    criarSessao(req, usuarioAutenticado);
    const { accessToken } = emitirTokens(res, usuarioAutenticado);

    return res.json({ 
      sucesso: true, 
      perfil: usuarioAutenticado.perfil, 
      retiro_id: usuarioAutenticado.retiro_id, 
      usuario: usuarioAutenticado, 
      accessToken 
    });
  } catch (error: any) {
    return res.status(404).json({ sucesso: false, erro: error.message });
  }
}

/**
 * Login simples da Infraestrutura: escolhe categoria (hidráulica/elétrica/cerca).
 * Cria sessão com perfil Infraestrutura.
 */
export function loginInfraestrutura(req: Request, res: Response) {
  const { categoria } = req.body;
  if (!categoria) {
    return res.status(400).json({ sucesso: false, erro: 'categoria obrigatória' });
  }

  const usuarioAutenticado = authService.autenticarInfra(categoria);

  criarSessao(req, usuarioAutenticado);
  const { accessToken } = emitirTokens(res, usuarioAutenticado);

  return res.json({ sucesso: true, perfil: 'Infraestrutura', categoria, usuario: usuarioAutenticado, accessToken });
}
