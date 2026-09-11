import type { APIRoute } from 'astro';
import { queryGet } from '../../../lib/db';
import { getTokenFromRequest } from '../../../lib/auth';

export const GET: APIRoute = async ({ request }) => {
  try {
    const tokenPayload = getTokenFromRequest(request);
    if (!tokenPayload) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const usuario = await queryGet<any>(
      'SELECT id, nombre, email, rol, celular, hacienda, ciudad, departamento, direccion, created_at FROM usuarios WHERE id = $1',
      [tokenPayload.id]
    );

    if (!usuario) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(usuario), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en /api/auth/me:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
