import type { APIRoute } from 'astro';
import { queryGet, queryRun } from '../../../lib/db';

function generarOrdenId(): string {
  const fecha = new Date();
  const year  = fecha.getFullYear().toString().slice(-2);
  const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const day   = fecha.getDate().toString().padStart(2, '0');
  const rand  = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `AG-${year}${month}${day}-${rand}`;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { items, total, metodoPago, nombre, telefono, direccion, notas } = await request.json();

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay productos en el pedido' }), { status: 400 });
    }

    const productosJson = JSON.stringify(items);
    const ordenId       = generarOrdenId();

    const { lastInsertRowid: pedidoId } = await queryRun(
      `INSERT INTO pedidos (orden_id, productos, total, metodo_pago, nombre_comprador, telefono_comprador, direccion, notas, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
      [ordenId, productosJson, total, metodoPago, nombre, telefono, direccion, notas]
    );

    for (const item of items) {
      const productoId = item.id || item.producto_id || null;
      const cantidad   = item.cantidad || 1;
      const precioUnit = item.precio || item.precio_unitario || 0;
      await queryRun(
        `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`,
        [pedidoId, productoId, cantidad, precioUnit]
      );
    }

    return new Response(JSON.stringify({ success: true, ordenId, pedidoId }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ request }) => {
  try {
    const url     = new URL(request.url);
    const ordenId = url.searchParams.get('ordenId');

    if (!ordenId) {
      return new Response(JSON.stringify({ error: 'Orden no especificada' }), { status: 400 });
    }

    const pedido = await queryGet<any>('SELECT * FROM pedidos WHERE orden_id = ?', [ordenId]);

    if (!pedido) {
      return new Response(JSON.stringify({ error: 'Orden no encontrada' }), { status: 404 });
    }

    const { queryAll } = await import('../../../lib/db');
    const detalles = await queryAll<any>(
      `SELECT d.*, p.nombre, img.url as imagen
       FROM detalle_pedido d
       LEFT JOIN productos p ON d.producto_id = p.id
       LEFT JOIN imagenes_producto img ON (img.producto_id = p.id AND img.orden = 0)
       WHERE d.pedido_id = ?
       ORDER BY d.id ASC`,
      [pedido.id]
    );

    const productos = (detalles || []).map(d => ({
      id: d.producto_id,
      nombre: d.nombre || 'Producto',
      cantidad: d.cantidad,
      precio: parseFloat(d.precio_unitario),
      precio_unitario: parseFloat(d.precio_unitario),
      imagen: d.imagen || '/images/ganado.svg',
    }));

    return new Response(JSON.stringify({
      success: true,
      pedido: { ...pedido, productos },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error al obtener pedido:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};