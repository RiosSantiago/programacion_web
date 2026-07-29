import type { APIRoute } from 'astro';
import { queryAll, queryGet, queryRun } from '../../../lib/db';

function getUser(auth: string | null): { id: number } | null {
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    return JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
  } catch {
    return null;
  }
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = getUser(request.headers.get('Authorization'));
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const items = await queryAll<any>(
      `SELECT c.id, c.producto_id, c.cantidad, c.fecha_agregado,
              p.nombre, p.precio, p.estado, p.stock, p.vendedor_id,
              u.nombre as vendedor,
              img.url as imagen
       FROM carrito c
       JOIN productos p ON c.producto_id = p.id
       LEFT JOIN usuarios u ON p.vendedor_id = u.id
       LEFT JOIN imagenes_producto img ON (img.producto_id = p.id AND img.orden = 0)
       WHERE c.usuario_id = $1
       ORDER BY c.fecha_agregado ASC`,
      [user.id]
    );

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = getUser(request.headers.get('Authorization'));
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const { producto_id, cantidad = 1 } = await request.json();
    if (!producto_id) {
      return new Response(JSON.stringify({ error: 'producto_id requerido' }), { status: 400 });
    }

    await queryRun(
      `INSERT INTO carrito (usuario_id, producto_id, cantidad)
       VALUES ($1, $2, $3)
       ON CONFLICT (usuario_id, producto_id)
       DO UPDATE SET cantidad = EXCLUDED.cantidad`,
      [user.id, producto_id, cantidad]
    );

    const item = await queryGet<any>(
      `SELECT c.id, c.producto_id, c.cantidad, c.fecha_agregado,
              p.nombre, p.precio, p.estado, p.stock, p.vendedor_id,
              u.nombre as vendedor,
              img.url as imagen
       FROM carrito c
       JOIN productos p ON c.producto_id = p.id
       LEFT JOIN usuarios u ON p.vendedor_id = u.id
       LEFT JOIN imagenes_producto img ON (img.producto_id = p.id AND img.orden = 0)
       WHERE c.usuario_id = $1 AND c.producto_id = $2`,
      [user.id, producto_id]
    );

    return new Response(JSON.stringify(item), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
