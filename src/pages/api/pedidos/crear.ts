import type { APIRoute } from 'astro';
import { queryGet, withTransaction } from '../../../lib/db';

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

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay productos en el pedido' }), { status: 400 });
    }

    const resultado = await withTransaction(async (tx) => {
      // 1. Validar stock de CADA producto en vivo dentro de la transacción
      for (const item of items) {
        const productoId = item.id || item.producto_id;
        const cantidad   = item.cantidad || 1;
        if (productoId) {
          const prod = await tx.queryGet<any>('SELECT stock, nombre FROM productos WHERE id = $1 FOR UPDATE', [productoId]);
          if (!prod) {
            throw new Error(`El producto ID ${productoId} ya no existe en el catálogo.`);
          }
          if (prod.stock === undefined || prod.stock === null || cantidad > prod.stock) {
            throw new Error(`Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock ?? 0}, solicitado: ${cantidad}.`);
          }
        }
      }

      // 2. Descontar stock atómicamente con condición stock >= cantidad
      for (const item of items) {
        const productoId = item.id || item.producto_id;
        const cantidad   = item.cantidad || 1;
        if (productoId) {
          const updateRes = await tx.queryRun(
            'UPDATE productos SET stock = stock - $1, precio = ROUND(COALESCE(precio_unitario, precio / NULLIF(stock, 0)) * (stock - $1), 2) WHERE id = $2 AND stock >= $1',
            [cantidad, productoId]
          );
          if (updateRes.changes === 0) {
            const prod = await tx.queryGet<any>('SELECT nombre FROM productos WHERE id = $1', [productoId]);
            throw new Error(`El stock del producto "${prod?.nombre || productoId}" cambió simultáneamente y ya no hay unidades suficientes.`);
          }
        }
      }

      // 3. Crear el pedido
      const productosJson = JSON.stringify(items);
      const ordenId       = generarOrdenId();

      const { lastInsertRowid: pedidoId } = await tx.queryRun(
        `INSERT INTO pedidos (orden_id, productos, total, metodo_pago, nombre_comprador, telefono_comprador, direccion, notas, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
        [ordenId, productosJson, total, metodoPago, nombre, telefono, direccion, notas]
      );

      // 4. Crear los detalles del pedido
      for (const item of items) {
        const productoId = item.id || item.producto_id || null;
        const cantidad   = item.cantidad || 1;
        const precioUnit = item.precio || item.precio_unitario || 0;
        await tx.queryRun(
          `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`,
          [pedidoId, productoId, cantidad, precioUnit]
        );
      }

      return { ordenId, pedidoId };
    });

    return new Response(JSON.stringify({ success: true, ...resultado }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error al crear pedido:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno del servidor' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
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