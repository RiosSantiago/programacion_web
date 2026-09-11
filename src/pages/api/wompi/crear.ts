import type { APIRoute } from 'astro';
import { queryRun, withTransaction } from '../../../lib/db';
import { crearPaymentLink, WOMPI_CHECKOUT_URL } from '../../../lib/wompi';
import { getRequestUser, unauthorized } from '../../../lib/rbac';
import { ApiError } from '../../../lib/errors';

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
    const user = getRequestUser(request);
    if (!user) return unauthorized();
    const usuarioId = user.id;

    const { items, total, metodoPago, nombre, telefono, direccion, notas } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay productos en el pedido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!nombre || !telefono || !direccion) {
      return new Response(JSON.stringify({ error: 'Nombre, teléfono y dirección son obligatorios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!total || total <= 0) {
      return new Response(JSON.stringify({ error: 'El total del pedido debe ser mayor a 0' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ordenId = generarOrdenId();

    const METODOS_ONLINE = ['pse', 'tarjeta', 'nequi', 'daviplata'];
    const metodoFinal = METODOS_ONLINE.includes(metodoPago) ? metodoPago : 'pse';

    // 1. Crear pedido, detalles y reservar stock en una transacción atómica
    const { pedidoId } = await withTransaction(async (tx) => {
      // Validar stock disponible
      for (const item of items) {
        const productoId = item.id || item.producto_id;
        const cantidad   = Number(item.cantidad) || 1;
        if (productoId) {
          const prod = await tx.queryGet<any>('SELECT stock, nombre FROM productos WHERE id = ? FOR UPDATE', [productoId]);
          if (!prod) {
            throw new ApiError(`El producto ID ${productoId} no existe.`);
          }
          if (prod.stock === undefined || prod.stock === null || cantidad > prod.stock) {
            throw new ApiError(`Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock ?? 0}, solicitado: ${cantidad}.`);
          }
        }
      }

      // Insertar pedido en PostgreSQL (esquema normalizado)
      const { lastInsertRowid: newPedidoId } = await tx.queryRun(
        `INSERT INTO pedidos (orden_id, usuario_id, total, metodo_pago, nombre_comprador, telefono_comprador, direccion, notas, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
        [ordenId, usuarioId, total, metodoFinal, nombre, telefono, direccion, notas || '']
      );

      for (const item of items) {
        const productoId = item.id || item.producto_id || null;
        const cantidad   = Number(item.cantidad) || 1;
        const precioUnit = Number(item.precio || item.precio_unitario) || 0;
        
        await tx.queryRun(
          `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`,
          [newPedidoId, productoId, cantidad, precioUnit]
        );

        if (productoId) {
          await tx.queryRun(
            `UPDATE productos SET stock = GREATEST(0, stock - ?) WHERE id = ?`,
            [cantidad, productoId]
          );
        }
      }

      return { pedidoId: newPedidoId };
    });

    // 2. Crear link de pago en Wompi
    const origin = new URL(request.url).origin;
    const redirectUrl = `${origin}/pedido-exito?orden=${ordenId}&metodo=${metodoFinal}`;
    const amountCents = Math.round(Number(total) * 100);

    let wompiData;
    try {
      wompiData = await crearPaymentLink({
        nombre: `Pedido ${ordenId}`,
        descripcion: `Compra en AgroUp - ${items.length} producto(s)`,
        montoCentavos: amountCents,
        expiracionHoras: 24,
        usoUnico: true,
        redirectUrl,
      });
    } catch (wompiErr: any) {
      console.error('[WOMPI] Error al generar payment link:', wompiErr?.message || wompiErr);
      
      // Si la pasarela falla, restaurar stock y marcar pedido en error atómicamente
      await withTransaction(async (tx) => {
        await tx.queryRun('UPDATE pedidos SET estado = ? WHERE id = ?', ['error', pedidoId]);
        for (const item of items) {
          const productoId = item.id || item.producto_id || null;
          const cantidad = Number(item.cantidad) || 1;
          if (productoId) {
            await tx.queryRun('UPDATE productos SET stock = stock + ? WHERE id = ?', [cantidad, productoId]);
          }
        }
      });

      return new Response(JSON.stringify({
        error: `Error al conectar con la pasarela de pago Wompi: ${wompiErr?.message || 'Verifica la configuración del comercio.'}`,
        ordenId,
        pedidoId,
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const wompiId = wompiData.data?.id;
    const checkoutUrl = wompiData.data?.booking_url || (wompiId ? `${WOMPI_CHECKOUT_URL}${wompiId}` : null);

    if (!checkoutUrl) {
      console.error('[WOMPI] Respuesta sin URL de pago:', JSON.stringify(wompiData));
      await withTransaction(async (tx) => {
        await tx.queryRun('UPDATE pedidos SET estado = ? WHERE id = ?', ['error', pedidoId]);
        for (const item of items) {
          const productoId = item.id || item.producto_id || null;
          const cantidad = Number(item.cantidad) || 1;
          if (productoId) {
            await tx.queryRun('UPDATE productos SET stock = stock + ? WHERE id = ?', [cantidad, productoId]);
          }
        }
      });

      return new Response(JSON.stringify({
        error: 'Wompi no generó la URL de pago requerida. Intenta nuevamente.',
        ordenId,
        pedidoId,
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Actualizar referencia de Wompi en el pedido
    await queryRun('UPDATE pedidos SET referencia_wompi = ? WHERE id = ?', [wompiId, pedidoId]);

    return new Response(JSON.stringify({
      success: true,
      ordenId,
      pedidoId,
      referenciaWompi: wompiId,
      urlPago: checkoutUrl,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[WOMPI/CREAR] Error interno:', error);
    // Los errores de negocio (ApiError) se muestran al usuario tal cual; los demás se sanitizan.
    if (error instanceof ApiError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Ocurrió un error, intenta de nuevo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
