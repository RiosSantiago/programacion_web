import type { APIRoute } from 'astro';
import { queryRun } from '../../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    if (!body.event || !body.data) {
      return new Response(JSON.stringify({ error: 'Evento inválido' }), { status: 400 });
    }

    const { event, data } = body;
    const reference = data.payment_link?.id || data.transaction?.reference;

    if (!reference) {
      return new Response(JSON.stringify({ error: 'Referencia no encontrada' }), { status: 400 });
    }

    let estado = 'pendiente';
    if (event === 'payment_link.expired') {
      estado = 'expirado';
    } else if (event === 'payment_link.payment_received') {
      estado = 'pagado';
    }

    await queryRun('UPDATE pedidos SET estado = ? WHERE orden_id = ? OR referencia_wompi = ?', [estado, reference, reference]);

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Error en webhook Wompi:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};