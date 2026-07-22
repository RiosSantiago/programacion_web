import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';

export const GET: APIRoute = async ({ request }) => {
  try {
    const auth = request.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    let payload: { id: number; email: string };
    try {
      payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    } catch {
      return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const userId = payload.id;

    const publicaciones = (db.prepare('SELECT COUNT(*) as count FROM productos WHERE vendedor_id = ?').get(userId) as any)?.count || 0;

    const ratingRow = db.prepare('SELECT AVG(vendedor_rating) as avg_rating, COUNT(*) as rated_count FROM productos WHERE vendedor_id = ? AND vendedor_rating IS NOT NULL AND vendedor_rating > 0').get(userId) as any;
    const rating = ratingRow?.avg_rating ? Math.round(ratingRow.avg_rating * 10) / 10 : 0;

    const ventas = (db.prepare("SELECT COUNT(*) as count FROM pedidos WHERE productos LIKE ?").get(`%"vendedor_id":${userId}%`) as any)?.count || 0;

    const vistas = (db.prepare('SELECT COUNT(*) as count FROM vistas_vendedor WHERE vendedor_id = ?').get(userId) as any)?.count || 0;

    return new Response(JSON.stringify({ publicaciones, rating, ventas, vistas }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en stats del vendedor:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
