import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';

interface Pedido {
  id: number;
  orden_id: string;
  usuario_id: number | null;
  productos: string;
  total: number;
  metodo_pago: string;
  estado: string;
  referencia_wompi: string | null;
  nombre_comprador: string | null;
  telefono_comprador: string | null;
  direccion: string | null;
  notas: string | null;
  created_at: string;
}

function generarOrdenId(): string {
  const fecha = new Date();
  const year = fecha.getFullYear().toString().slice(-2);
  const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const day = fecha.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `AG-${year}${month}${day}-${random}`;
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

    return new Response(JSON.stringify({
      success: true,
      ordenId,
      pedidoId,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const ordenId = url.searchParams.get('ordenId');

    if (!ordenId) {
      return new Response(JSON.stringify({ error: 'Orden no especificada' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const pedido = db.prepare('SELECT * FROM pedidos WHERE orden_id = ?').get(ordenId) as Pedido | undefined;

    if (!pedido) {
      return new Response(JSON.stringify({ error: 'Orden no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      pedido: {
        ...pedido,
        productos: JSON.parse(pedido.productos),
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};