import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AccessUser, Env } from './types.js';
import { errorJson } from './errors.js';

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);
const LOCAL_DEV_HOST = 'wooly.dev.hexly.ai';
const jwksByIssuer = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function accessKeys(issuer: string) {
  let keys = jwksByIssuer.get(issuer);
  if (!keys) {
    keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    jwksByIssuer.set(issuer, keys);
  }
  return keys;
}

export function localRequest(
  request: Request,
  env: Pick<Env, 'ENVIRONMENT'>,
): boolean {
  if (env.ENVIRONMENT !== 'local' && env.ENVIRONMENT !== 'test') {
    return false;
  }
  const hostname = new URL(request.url).hostname;
  const peer = request.headers.get('cf-connecting-ip');
  const loopbackPeer = peer === '127.0.0.1' || peer === '::1';
  if (LOOPBACK_HOSTS.has(hostname)) {
    return !peer || loopbackPeer;
  }
  return hostname === LOCAL_DEV_HOST && loopbackPeer;
}

function localUser(env: Env): AccessUser | Response {
  const email = env.LOCAL_USER_EMAIL.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+$/.test(email)) {
    return errorJson('CONFIG_ERROR', 'Local identity is not configured', 503);
  }
  return { email, name: email.slice(0, email.indexOf('@')) };
}

export async function verifyAccess(
  request: Request,
  env: Env,
): Promise<AccessUser | Response> {
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) {
    return errorJson('UNAUTHORIZED', 'Missing Cloudflare Access token', 401);
  }
  if (!/^[a-z0-9-]+$/.test(env.CF_ACCESS_TEAM_DOMAIN) || !env.CF_ACCESS_AUD) {
    return errorJson(
      'CONFIG_ERROR',
      'Cloudflare Access is not configured',
      503,
    );
  }
  const issuer = `https://${env.CF_ACCESS_TEAM_DOMAIN}.cloudflareaccess.com`;
  try {
    const { payload } = await jwtVerify(
      token,
      accessKeys(issuer),
      {
        algorithms: ['RS256'],
        issuer,
        audience: env.CF_ACCESS_AUD,
        requiredClaims: ['exp', 'iat', 'sub', 'email'],
      },
    );
    if (
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      typeof payload.email !== 'string' ||
      !/^[^@\s]+@[^@\s]+$/.test(payload.email)
    ) {
      return errorJson('UNAUTHORIZED', 'Invalid Access identity', 401);
    }
    const email = payload.email.toLowerCase();
    return {
      email,
      name:
        typeof payload.name === 'string' && payload.name
          ? payload.name
          : email.slice(0, email.indexOf('@')),
    };
  } catch {
    return errorJson('UNAUTHORIZED', 'Invalid Access token', 401);
  }
}

function originDenied(request: Request): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return false;
  }
  const origin = request.headers.get('origin');
  return (
    origin !== new URL(request.url).origin ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  );
}

export async function authenticate(
  request: Request,
  env: Env,
): Promise<AccessUser | Response> {
  const user = localRequest(request, env)
    ? localUser(env)
    : await verifyAccess(request, env);
  if (user instanceof Response) {
    return user;
  }
  if (originDenied(request)) {
    return errorJson('FORBIDDEN', 'Invalid request origin', 403);
  }
  return user;
}
