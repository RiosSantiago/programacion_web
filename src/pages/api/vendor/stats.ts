import type { APIRoute } from 'astro';
import { queryGet } from '../../../lib/db';
import { getTokenFromRequest } from '../../../lib/auth';

export const GET: APIRoute = async ({ request }) => {
  try {
    const tokenPayload = getTokenFromRequest(request);
    if (!tokenPayload) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const userId = tokenPayload.id;

    const publicacionesRow = await queryGet<{ count: string }>(
      'SELECT COUNT(*) as count FROM productos WHERE vendedor_id = ?', [userId]
    );
    const publicaciones = Number(publicacionesRow?.count ?? 0);

    const ratingRow = await queryGet<any>(
      'SELECT AVG(vendedor_rating) as avg_rating FROM productos WHERE vendedor_id = ? AND vendedor_rating IS NOT NULL AND vendedor_rating > 0',
      [userId]
    );
    const rating = ratingRow?.avg_rating ? Math.round(parseFloat(ratingRow.avg_rating) * 10) / 10 : 0;

    const ventasRow = await queryGet<{ count: string }>(
      `SELECT COUNT(DISTINCT d.pedido_id) as count
       FROM detalle_pedido d
       JOIN productos p ON d.producto_id = p.id
       WHERE p.vendedor_id = ?`,
      [userId]
    );
    let ventas = Number(ventasRow?.count ?? 0);

    const vistasRow = await queryGet<{ count: string }>(
      'SELECT COUNT(*) as count FROM vistas_vendedor WHERE vendedor_id = ?', [userId]
    );
    const vistas = Number(vistasRow?.count ?? 0);

    return new Response(JSON.stringify({ publicaciones, rating, ventas, vistas }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en stats del vendedor:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
