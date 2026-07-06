import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import crypto from 'crypto';

const WOMPI_PUBLIC_KEY = import.meta.env.WOMPI_PUBLIC_KEY || 'pub_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const WOMPI_PRIVATE_KEY = import.meta.env.WOMPI_PRIVATE_KEY || 'prv_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const WOMPI_BASE_URL = 'https://sandbox.wompi.co/v1';
const WOMPI_EVENT_URL = import.meta.env.WOMPI_EVENT_URL || 'https://tudominio.com/api/wompi/webhook';

interface Pedido {
  id: number;
  orden_id: string;
}

function generarOrdenId(): string {
  const fecha = new Date();
  const year = fecha.getFullYear().toString().slice(-2);
  const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const day = fecha.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `AG-${year}${month}${day}-${random}`;
}

function signatureVerify(data: string, secret: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { items, total, metodoPago, nombre, telefono, direccion, notas } = await request.json();

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay productos en el pedido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const productosJson = JSON.stringify(items);
    const ordenId = generarOrdenId();

    const result = db.prepare(`
      INSERT INTO pedidos (orden_id, productos, total, metodo_pago, nombre_comprador, telefono_comprador, direccion, notas, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')
    `).run(ordenId, productosJson, total, metodoPago, nombre, telefono, direccion, notas);

    const pedidoId = result.lastInsertRowid as number;
    const amountCents = Math.round(total * 100);

    let paymentMethod = {};
    switch (metodoPago) {
      case 'pse':
        paymentMethod = {
          type: 'PSE',
          payment_description: 'Pago PSE - Agroup',
          user_type: 0,
          user_legal_id: '123456789',
        };
        break;
      case 'nequi':
        paymentMethod = {
          type: 'NEQUI',
          phone_number: telefono,
        };
        break;
      case 'daviplata':
        paymentMethod = {
          type: 'BANCOLOMBIA_TRANSFER',
          phone_number: telefono,
        };
        break;
      case 'tarjeta':
        paymentMethod = {
          type: 'CARD',
          token: '',
        };
        break;
      default:
        paymentMethod = { type: 'CARD' };
    }

    const reference = ordenId;
    const currency = 'COP';
    const signatureInput = `${reference}${amountCents}${currency}${WOMPI_PRIVATE_KEY}`;
    const signatureHash = signatureVerify(signatureInput, WOMPI_PRIVATE_KEY);

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
        db.prepare('UPDATE pedidos SET referencia_wompi = ? WHERE id = ?')
          .run(wompiData.data.id, pedidoId);

        const checkoutUrl = wompiData.data.expired ? 
          `${WOMPI_BASE_URL}/payment_links/${wompiData.data.id}` :
          wompiData.data.booking_url;

        return new Response(JSON.stringify({
          success: true,
          ordenId,
          pedidoId,
          referenciaWompi: wompiData.data.id,
          urlPago: checkoutUrl,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (wompiError) {
      console.error('Error conectando con Wompi:', wompiError);
    }

    return new Response(JSON.stringify({
      success: true,
      ordenId,
      pedidoId,
      modo: 'desarrollo',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al procesar pago:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};