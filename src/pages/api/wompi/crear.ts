import type { APIRoute } from 'astro';
import { queryRun } from '../../../lib/db';
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
          description: `Compra en Agroup - ${items.length} producto(s)`,
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
  } catch (error) {
    console.error('Error al procesar pago:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};