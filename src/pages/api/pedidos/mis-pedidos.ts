import type { APIRoute } from 'astro';
import { queryAll } from '../../../lib/db';
import { getRequestUser, unauthorized } from '../../../lib/rbac';

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = getRequestUser(request);
    if (!user) return unauthorized();

    const pedidos = await queryAll<any>(
      `SELECT
        p.id,
        p.orden_id,
        p.total,
        p.metodo_pago,
        p.estado,
        p.nombre_comprador,
        p.telefono_comprador,
        p.direccion,
        p.notas,
        p.created_at,
        (
          SELECT json_agg(json_build_object(
            'producto_id', d.producto_id,
            'nombre', COALESCE(prod.nombre, 'Producto'),
            'cantidad', d.cantidad,
            'precio_unitario', d.precio_unitario,
            'imagen', COALESCE(img.url, '/images/ganado.svg')
          ))
          FROM detalle_pedido d
          LEFT JOIN productos prod ON d.producto_id = prod.id
          LEFT JOIN imagenes_producto img ON img.producto_id = prod.id AND img.orden = 0
          WHERE d.pedido_id = p.id
        ) AS productos
      FROM pedidos p
      WHERE p.usuario_id = $1
      ORDER BY p.created_at DESC
      LIMIT 50`,
      [user.id]
    );

    const result = (pedidos || []).map(p => ({
      ...p,
      productos: p.productos || [],
    }));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error obteniendo pedidos:', error);
    return new Response(JSON.stringify({ error: 'Ocurrió un error, intenta de nuevo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
