import { defineMiddleware } from 'astro/middleware';
import { queryGet } from './lib/db';

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

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  const publicas  = ['/api/admin/root', '/api/admin/check'];
  const isAdminApi = url.pathname.startsWith('/api/admin/') && !publicas.includes(url.pathname);

  if (isAdminApi) {
    const user = getUserFromToken(context.request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }
    const row = await queryGet<{ rol: string }>('SELECT rol FROM usuarios WHERE id = ?', [user.id]);
    const role = row?.rol || null;
    if (role !== 'root' && role !== 'admin') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return next();
});
