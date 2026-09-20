import type { AccessUser, Env } from './types.js';
import { version } from '../../package.json';
import { errorJson } from './errors.js';
import { authenticate } from './auth.js';
import {
  handleGetDataset,
  handlePutDataset,
  handleResetDataset,
} from './routes/dataset.js';

const API_METHODS: Record<string, readonly string[]> = {
  '/api/live': ['GET'],
  '/api/session': ['GET'],
  '/api/data': ['GET', 'PUT'],
  '/api/data/reset': ['POST'],
};

async function handleLive(env: Env): Promise<Response> {
  try {
    await env.DB.prepare('SELECT 1').first();
    return Response.json({ status: 'ok', version, storage: 'd1', database: { connected: true } });
  } catch {
    return Response.json({ status: 'unavailable', version }, { status: 503 });
  }
}

function handleSession(user: AccessUser): Response {
  return Response.json({ user: { email: user.email, name: user.name } });
}

async function handleFetch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;

  if (pathname.startsWith('/api/')) {
    const allowed = API_METHODS[pathname];
    if (!allowed) {
      return errorJson('NOT_FOUND', `No route: ${method} ${pathname}`, 404);
    }
    if (!allowed.includes(method)) {
      return errorJson(
        'METHOD_NOT_ALLOWED',
        `${method} not allowed for ${pathname}`,
        405,
      );
    }
    if (pathname === '/api/live') {
      return handleLive(env);
    }
    const auth = await authenticate(request, env);
    if (auth instanceof Response) {
      return auth;
    }
    if (pathname === '/api/session') {
      return handleSession(auth);
    }
    if (pathname === '/api/data' && method === 'GET') {
      return handleGetDataset(env);
    }
    if (pathname === '/api/data' && method === 'PUT') {
      return handlePutDataset(request, env);
    }
    return handleResetDataset(env);
  }

  const auth = await authenticate(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await handleFetch(request, env);
    if (new URL(request.url).pathname.startsWith('/api/')) {
      response.headers.set('Cache-Control', 'no-store');
    }
    return response;
  },
} satisfies ExportedHandler<Env>;
