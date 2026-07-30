import { defineMiddleware } from 'astro/middleware';
import { queryGet, inicializar } from './lib/db';

let dbInicializada = false;

function getUserFromToken(request: Request): { id: number; email: string } | null {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const raw = Buffer.from(auth.slice(7), 'base64').toString();
    const payload = JSON.parse(raw);
    if (!payload || typeof payload.id !== 'number') return null;
    if (payload.exp && Date.now() > payload.exp) return null;
    return { id: payload.id, email: String(payload.email || '') };
  } catch {
    return null;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  if (!dbInicializada) {
    dbInicializada = true;
    try {
      await inicializar();
      console.log('[DB] Esquema PostgreSQL inicializado');
    } catch (e) {
      console.error('[DB] Error al inicializar esquema:', e);
    }
  }

  const url = new URL(context.request.url);

  const publicas = ['/api/admin/root', '/api/admin/check'];
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
