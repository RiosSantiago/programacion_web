import type { APIRoute } from 'astro';
import { queryAll, queryGet, queryRun } from '../../../lib/db';
import { getTokenFromRequest } from '../../../lib/auth';

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = getTokenFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const favoritos = await queryAll<any>(
      `SELECT f.id, f.producto_id, f.fecha_agregado,
              p.nombre, p.precio, p.estado, p.stock,
              img.url as imagen
       FROM favoritos f
       JOIN productos p ON f.producto_id = p.id
       LEFT JOIN imagenes_producto img ON (img.producto_id = p.id AND img.orden = 0)
       WHERE f.usuario_id = $1
       ORDER BY f.fecha_agregado DESC`,
      [user.id]
    );

    return new Response(JSON.stringify(favoritos), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = getTokenFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const { producto_id } = await request.json();
    if (!producto_id) {
      return new Response(JSON.stringify({ error: 'producto_id requerido' }), { status: 400 });
    }

    await queryRun(
      `INSERT INTO favoritos (usuario_id, producto_id)
       VALUES ($1, $2)
       ON CONFLICT (usuario_id, producto_id) DO NOTHING`,
      [user.id, producto_id]
    );

    const favorito = await queryGet<any>(
      `SELECT f.id, f.producto_id, f.fecha_agregado,
              p.nombre, p.precio, p.estado, p.stock,
              img.url as imagen
       FROM favoritos f
       JOIN productos p ON f.producto_id = p.id
       LEFT JOIN imagenes_producto img ON (img.producto_id = p.id AND img.orden = 0)
       WHERE f.usuario_id = $1 AND f.producto_id = $2`,
      [user.id, producto_id]
    );

    return new Response(JSON.stringify(favorito), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al agregar favorito:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
