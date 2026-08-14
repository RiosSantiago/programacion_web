import type { APIRoute } from 'astro';
import { queryGet, queryRun, withTransaction } from '../../../lib/db';
import crypto from 'crypto';

const WOMPI_PRIVATE_KEY = import.meta.env.WOMPI_PRIVATE_KEY || 'prv_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const WOMPI_BASE_URL = 'https://sandbox.wompi.co/v1';

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

    const { ordenId, pedidoId } = await withTransaction(async (tx) => {
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

    const amountCents = Math.round(total * 100);
    const reference   = ordenId;
    const currency    = 'COP';

    try {
      const wompiRes = await fetch(`${WOMPI_BASE_URL}/payment_links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WOMPI_PRIVATE_KEY}`,
        },
        body: JSON.stringify({
          name: `Pedido ${ordenId}`,
          description: `Compra en AgroUp - ${items.length} producto(s)`,
          single_use: true,
          amount_in_cents: amountCents,
          currency,
          expiration_time: 24 * 60 * 60,
          collect_shipping_address: false,
          payment_methods: ['PSE', 'CARD', 'NEqui', 'BANCOLOMBIA_TRANSFER'],
        }),
      });

      const wompiData = await wompiRes.json();

      if (wompiData.data?.id) {
        await queryRun('UPDATE pedidos SET referencia_wompi = ? WHERE id = ?', [wompiData.data.id, pedidoId]);

        const checkoutUrl = wompiData.data.expired ? 
          `${WOMPI_BASE_URL}/payment_links/${wompiData.data.id}` :
          wompiData.data.booking_url;

        return new Response(JSON.stringify({
          success: true,
          ordenId,
          pedidoId,
          referenciaWompi: wompiData.data.id,
          urlPago: checkoutUrl,
        }), { status: 200 });
      }
    } catch (wompiError) {
      console.error('Error conectando con Wompi:', wompiError);
    }

    return new Response(JSON.stringify({
      success: true,
      ordenId,
      pedidoId,
      modo: 'desarrollo',
    }), { status: 200 });
  } catch (error: any) {
    console.error('Error al procesar pago:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno del servidor' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};