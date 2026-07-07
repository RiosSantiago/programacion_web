import { defineMiddleware } from 'astro/middleware';
import { db } from './lib/db';

function getUserFromToken(request: Request): { id: number; email: string } | null {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return { id: payload.id, email: payload.email };
  } catch {
    return null;
  }
}

function getRequestRole(request: Request): string | null {
  const user = getUserFromToken(request);
  if (!user) return null;
  try {
    const row = db.prepare('SELECT rol FROM usuarios WHERE id = ?').get(user.id) as { rol: string } | undefined;
    return row?.rol || null;
  } catch {
    return null;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  const publicas = ['/api/admin/root', '/api/admin/check'];
  const isAdminApi = url.pathname.startsWith('/api/admin/') && !publicas.includes(url.pathname);

  if (isAdminApi) {
    const role = getRequestRole(context.request);
    if (role !== 'root' && role !== 'admin') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const response = await next();
  return response;
});
