import type { APIRoute } from 'astro';
import { queryAll } from '../../../lib/db';
import { getAuthContext, unauthorized, forbidden } from '../../../lib/rbac';

export const GET: APIRoute = async ({ request }) => {
  try {
    const ctx = await getAuthContext(request);
    if (!ctx) return unauthorized();
    if (ctx.rol !== 'root' && ctx.rol !== 'admin') return forbidden();

    const url = new URL(request.url);
    const limit  = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 100);
    const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0);

    const selectCols = 'id, nombre, email, celular, rol, verificado, created_at';
    const rows = await queryAll(`SELECT ${selectCols} FROM usuarios ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset]);
    const totalRes = await queryAll<{ total: number }>('SELECT COUNT(*)::int AS total FROM usuarios');
    const total = Number(totalRes[0]?.total ?? 0);
    return new Response(JSON.stringify({ usuarios: rows, total, limit, offset }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
