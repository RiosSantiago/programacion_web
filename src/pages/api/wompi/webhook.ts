import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import crypto from 'node:crypto';

const WOMPI_PRIVATE_KEY = import.meta.env.WOMPI_PRIVATE_KEY || 'prv_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx';

export const POST: APIRoute = async ({ request }) => {
  try {
    const signature = request.headers.get('Wompi-Signature');
    const body = await request.json();

    if (!body.event || !body.data) {
      return new Response(JSON.stringify({ error: 'Evento inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { event, data } = body;
    const reference = data.payment_link?.id || data.transaction?.reference;

    if (!reference) {
      return new Response(JSON.stringify({ error: 'Referencia no encontrada' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let estado = 'pendiente';
    if (event === 'payment_link.expired') {
      estado = 'expirado';
    } else if (event === 'payment_link.payment_received') {
      estado = 'pagado';
    }

    db.prepare('UPDATE pedidos SET estado = ? WHERE orden_id = ? OR referencia_wompi = ?')
      .run(estado, reference, reference);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en webhook Wompi:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};