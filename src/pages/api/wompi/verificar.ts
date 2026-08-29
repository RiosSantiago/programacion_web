import type { APIRoute } from 'astro';
import { queryGet, queryRun } from '../../../lib/db';
import {
  verificarTransaccion,
  verificarTransaccionPorReferencia,
  mapWompiStatus,
} from '../../../lib/wompi';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const transactionId = url.searchParams.get('transaction_id') || url.searchParams.get('id');
    const reference = url.searchParams.get('reference') || url.searchParams.get('orden_id');
    const paymentLinkId = url.searchParams.get('payment_link_id');

    if (!transactionId && !reference && !paymentLinkId) {
      return new Response(JSON.stringify({ error: 'Debes proporcionar un ID de transacción o referencia' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let tx = null;

    if (transactionId) {
      try {
        tx = await verificarTransaccion(transactionId);
      } catch (err: any) {
        console.error('[WOMPI/VERIFICAR] Error consultando transacción:', err?.message);
      }
    }

    if (!tx && reference) {
      try {
        tx = await verificarTransaccionPorReferencia(reference);
      } catch (err: any) {
        console.error('[WOMPI/VERIFICAR] Error consultando referencia:', err?.message);
      }
    }

    if (tx) {
      const dbEstado = mapWompiStatus(tx.status);
      const ref = tx.reference || reference;

      if (ref) {
        await queryRun(
          'UPDATE pedidos SET estado = ? WHERE orden_id = ? OR referencia_wompi = ?',
          [dbEstado, ref, ref]
        );
      }

      return new Response(JSON.stringify({
        success: true,
        status: tx.status,
        estado: dbEstado,
        transaction: {
          id: tx.id,
          amount_in_cents: tx.amount_in_cents,
          reference: tx.reference,
          status: tx.status,
          payment_method_type: tx.payment_method_type,
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Si no se encontró transacción directa en Wompi, consultar estado en DB local
    if (reference) {
      const pedido = await queryGet<any>(
        'SELECT * FROM pedidos WHERE orden_id = ? OR referencia_wompi = ?',
        [reference, reference]
      );

      if (pedido) {
        let status = 'PENDING';
        if (pedido.estado === 'pagado') status = 'APPROVED';
        else if (pedido.estado === 'rechazado') status = 'DECLINED';
        else if (pedido.estado === 'error') status = 'ERROR';

        return new Response(JSON.stringify({
          success: true,
          status,
          estado: pedido.estado,
          pedido: {
            ordenId: pedido.orden_id,
            total: pedido.total,
            estado: pedido.estado,
          },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      success: false,
      status: 'PENDING',
      message: 'Transacción en proceso de registro',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[WOMPI/VERIFICAR] Error:', error);
    return new Response(JSON.stringify({ error: 'Ocurrió un error, intenta de nuevo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
