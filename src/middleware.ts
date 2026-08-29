import { defineMiddleware } from 'astro/middleware';
import { queryGet, inicializar } from './lib/db';
import { getTokenFromRequest } from './lib/auth';

let dbInicializada = false;

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
    // Verificar JWT firmado (con fallback a legacy Base64 durante migración)
    const tokenPayload = getTokenFromRequest(context.request);
    if (!tokenPayload) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar rol en BD en tiempo real (no confiar solo en el payload del token)
    const row = await queryGet<{ rol: string }>('SELECT rol FROM usuarios WHERE id = ?', [tokenPayload.id]);
    const role = row?.rol || null;
    if (role !== 'root' && role !== 'admin') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403, headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return next();
});
