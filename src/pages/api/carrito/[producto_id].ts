import type { APIRoute } from 'astro';
import { queryGet, queryRun } from '../../../lib/db';

function getUser(auth: string | null): { id: number } | null {
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    return JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
  } catch {
    return null;
  }
}

export const PATCH: APIRoute = async ({ request, params }) => {
  try {
    const user = getUser(request.headers.get('Authorization'));
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const producto_id = parseInt(params.producto_id || '', 10);
    if (!producto_id) {
      return new Response(JSON.stringify({ error: 'producto_id inválido' }), { status: 400 });
    }

    const { cantidad } = await request.json();
    if (!cantidad || cantidad < 1) {
      return new Response(JSON.stringify({ error: 'cantidad debe ser mayor a 0' }), { status: 400 });
    }

    const prod = await queryGet<any>('SELECT stock, nombre FROM productos WHERE id = $1', [producto_id]);
    if (prod && prod.stock !== undefined && prod.stock !== null && cantidad > prod.stock) {
      return new Response(
        JSON.stringify({ error: `Stock máximo disponible para "${prod.nombre}": ${prod.stock}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await queryRun(
      'UPDATE carrito SET cantidad = $1 WHERE usuario_id = $2 AND producto_id = $3',
      [cantidad, user.id, producto_id]
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
    console.error('Error al actualizar carrito:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    const user = getUser(request.headers.get('Authorization'));
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const producto_id = parseInt(params.producto_id || '', 10);
    if (!producto_id) {
      return new Response(JSON.stringify({ error: 'producto_id inválido' }), { status: 400 });
    }

    await queryRun(
      'DELETE FROM carrito WHERE usuario_id = $1 AND producto_id = $2',
      [user.id, producto_id]
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
