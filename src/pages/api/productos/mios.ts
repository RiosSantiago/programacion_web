import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';

export const GET: APIRoute = async ({ request }) => {
  try {
    const auth = request.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = auth.slice(7);
    let payload: { id: number; email: string };
    try {
      payload = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rows = db.prepare('SELECT * FROM productos WHERE vendedor_id = ? ORDER BY id DESC').all(payload.id) as any[];

    const productos = rows.map((row) => {
      let imagenes: string[] = [];
      try { imagenes = JSON.parse(row.imagenes); } catch { imagenes = []; }
      return {
        ...row,
        imagenes,
        imagen: imagenes[0] || '/images/ganado.svg',
        destacado: row.destacado === 1,
        oferta: row.oferta === 1,
        trazabilidad: row.trazabilidad === 1,
        envio: row.envio === 1,
      };
    });

    return new Response(JSON.stringify({ productos }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
