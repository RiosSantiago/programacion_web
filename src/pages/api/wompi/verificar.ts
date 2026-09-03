import type { APIRoute } from 'astro';
import { queryGet } from '../../../lib/db';
import { getAuthContext, unauthorized, forbidden } from '../../../lib/rbac';
import { createRateLimiter, getClientIp, WINDOW_15_MIN } from '../../../lib/rate-limit';
import {
  verificarTransaccion,
  verificarTransaccionPorReferencia,
  mapWompiStatus,
} from '../../../lib/wompi';

// Mitigación inmediata contra fuerza bruta/enumeración de orden_id
// (entropía baja, sin UNIQUE). Mismo patrón que en login/recuperar.
// NOTA: M3 (entropía de orden_id) sigue pendiente de resolver de raíz.
const verificarIpLimiter  = createRateLimiter({ windowMs: WINDOW_15_MIN, max: 30 });
const verificarRefLimiter = createRateLimiter({ windowMs: WINDOW_15_MIN, max: 10 });

export const GET: APIRoute = async ({ request }) => {
  try {
    // 1. Sesión OPCIONAL al inicio (invitados reales no tienen token).
    // El contexto existe solo si hay token válido; NO cortamos con 401 aquí.
    const ctx = await getAuthContext(request);
    const esAdmin = ctx?.rol === 'root' || ctx?.rol === 'admin';

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

    // 2. Rate limiting por IP y por referencia consultada
    const ip = getClientIp(request);
    const refKey = reference ? `ref:${reference}` : 'tx';
    const bloqueoIp  = verificarIpLimiter.isBlocked(ip);
    const bloqueoRef = verificarRefLimiter.isBlocked(refKey);
    if (bloqueoIp.blocked || bloqueoRef.blocked) {
      const segundos = Math.max(bloqueoIp.retryAfterSeconds, bloqueoRef.retryAfterSeconds);
      return new Response(JSON.stringify({
        error: 'Demasiadas consultas. Intenta de nuevo en unos minutos.',
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(segundos) },
      });
    }
    verificarIpLimiter.hit(ip);
    if (reference) verificarRefLimiter.hit(refKey);

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

      // Este endpoint pasa a ser de SOLO LECTURA: ya NO se actualiza el estado aquí.
      // La reconciliación autoritativa del estado la hace exclusivamente webhook.ts (valida HMAC).

      // 3. Ownership condicional: si el pedido tiene dueño, exigir sesión y que coincida.
      if (ref) {
        const pedidoDeTx = await queryGet<any>(
          'SELECT id, usuario_id FROM pedidos WHERE orden_id = ? OR referencia_wompi = ?',
          [ref, ref]
        );
        if (pedidoDeTx && pedidoDeTx.usuario_id != null) {
          if (!ctx) return unauthorized();
          if (!esAdmin && pedidoDeTx.usuario_id !== ctx.user.id) return forbidden();
        }
        // Si el pedido no existe en BD o es invitado (usuario_id NULL): se deja pasar.
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
        // 4. Ownership condicional: pedido con dueño exige sesión + coincidencia.
        // Pedido invitado (usuario_id NULL) accesible sin sesión.
        if (pedido.usuario_id != null) {
          if (!ctx) return unauthorized();
          if (!esAdmin && pedido.usuario_id !== ctx.user.id) return forbidden();
        }
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
