import { SignOptions } from 'jsonwebtoken';

export interface JwtUserPayload {
  id: string;
  nome: string;
  perfil: string;
  retiro_id: string | null;
  is_admin?: boolean;
  categoria?: string;
}

export interface JwtRefreshPayload extends JwtUserPayload {
  jti: string;
}

function getRequiredSecret(name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET') {
  const value = process.env[name];

  if (value) {
    return value;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} precisa ser definido em producao`);
  }

  return `${name.toLowerCase()}-dev-secret`;
}

function durationToMs(value: string) {
  const match = value.match(/^(\d+)(ms|s|m|h|d)?$/);

  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2] || 'ms';
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
}

const refreshTokenExpiresIn = (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

export const authConfig = {
  accessSecret: getRequiredSecret('JWT_ACCESS_SECRET'),
  refreshSecret: getRequiredSecret('JWT_REFRESH_SECRET'),
  accessTokenExpiresIn: (process.env.ACCESS_TOKEN_EXPIRES_IN || '15m') as SignOptions['expiresIn'],
  refreshTokenExpiresIn,
  refreshCookieName: 'refreshToken',
  refreshCookieMaxAgeMs: durationToMs(String(refreshTokenExpiresIn)),
};
