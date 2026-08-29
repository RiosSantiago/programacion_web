import type { APIRoute } from 'astro';
import { queryRun } from '../../../lib/db';
import { getTokenFromRequest } from '../../../lib/auth';

export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    const user = getTokenFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const producto_id = parseInt(params.producto_id || '', 10);
    if (!producto_id) {
      return new Response(JSON.stringify({ error: 'producto_id inválido' }), { status: 400 });
    }

    await queryRun(
      'DELETE FROM favoritos WHERE usuario_id = $1 AND producto_id = $2',
      [user.id, producto_id]
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al eliminar favorito:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
