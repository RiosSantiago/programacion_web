import type { APIRoute } from 'astro';
import { withTransaction } from '../../../lib/db';
import { mapWompiStatus, validarChecksumWompi } from '../../../lib/wompi';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    if (!body || !body.event || !body.data) {
      return new Response(JSON.stringify({ error: 'Payload de evento inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. VALIDACIÓN HMAC-SHA256 DEL CHECKSUM DE WOMPI
    // Siguiendo especificación oficial: concat(properties) + timestamp + WOMPI_EVENTS_SECRET -> SHA256
    const esValido = validarChecksumWompi(body);
    if (!esValido) {
      console.warn('[WOMPI/WEBHOOK] Intento de webhook con firma / checksum inválido o secreto no configurado.');
      return new Response(JSON.stringify({ error: 'Firma / Checksum no autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. EXTRAER EVENTO, REFERENCIA Y ESTADO OBJETIVO
    const { event, data } = body;
    let reference = '';
    let nuevoEstado = 'pendiente';

    if (event === 'transaction.updated' && data.transaction) {
      const tx = data.transaction;
      reference = tx.reference || '';
      nuevoEstado = mapWompiStatus(tx.status);
    } else if (event.startsWith('payment_link.')) {
      reference = data.payment_link?.id || '';
      if (event === 'payment_link.payment_received') {
        nuevoEstado = 'pagado';
      } else if (event === 'payment_link.expired') {
        nuevoEstado = 'expirado';
      }
    } else if (data.transaction?.reference) {
      reference = data.transaction.reference;
      nuevoEstado = mapWompiStatus(data.transaction.status);
    }

    if (!reference) {
      return new Response(JSON.stringify({ error: 'No se encontró referencia en el evento' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. ACTUALIZACIÓN ATÓMICA CON withTransaction Y DEVOLUCIÓN DE STOCK
    const resultado = await withTransaction(async (tx) => {
      // Consultar pedido actual
      const pedido = await tx.queryGet<any>(
        'SELECT id, orden_id, estado, total FROM pedidos WHERE orden_id = ? OR referencia_wompi = ?',
        [reference, reference]
      );

      if (!pedido) {
        console.warn(`[WOMPI/WEBHOOK] Pedido no encontrado para referencia: ${reference}`);
        return { encontrado: false, estadoAnterior: null, estadoNuevo: nuevoEstado, stockReintegrado: false };
      }

      const estadoAnterior = pedido.estado;
      let stockReintegrado = false;

      // Estados de rechazo/expiración que requieren reintegro de stock
      const estadosDevolucion = ['expirado', 'rechazado', 'anulado', 'error'];
      // Idempotencia: reintegrar solo si antes NO estaba ya expirado/rechazado/anulado/error ni pagado
      const debeReintegrarStock =
        estadosDevolucion.includes(nuevoEstado) &&
        !estadosDevolucion.includes(estadoAnterior) &&
        estadoAnterior !== 'pagado';

      if (debeReintegrarStock) {
        // Obtener productos y cantidades asociadas a este pedido
        const detalles = await tx.queryAll<{ producto_id: number | null; cantidad: number }>(
          'SELECT producto_id, cantidad FROM detalle_pedido WHERE pedido_id = ?',
          [pedido.id]
        );

        for (const item of detalles) {
          if (item.producto_id && item.cantidad > 0) {
            await tx.queryRun(
              'UPDATE productos SET stock = stock + ? WHERE id = ?',
              [item.cantidad, item.producto_id]
            );
          }
        }
        stockReintegrado = true;
      }

      // Actualizar estado del pedido
      await tx.queryRun(
        'UPDATE pedidos SET estado = ? WHERE id = ?',
        [nuevoEstado, pedido.id]
      );

      return {
        encontrado: true,
        pedidoId: pedido.id,
        ordenId: pedido.orden_id,
        estadoAnterior,
        estadoNuevo: nuevoEstado,
        stockReintegrado,
      };
    });

    return new Response(JSON.stringify({
      received: true,
      ...resultado,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[WOMPI/WEBHOOK] Error procesando webhook:', error);
    return new Response(JSON.stringify({ error: 'Error interno en webhook' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
