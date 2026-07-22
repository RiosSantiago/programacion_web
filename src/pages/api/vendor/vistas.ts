import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { vendedor_id, producto_id } = await request.json();

    if (!vendedor_id || !producto_id) {
      return new Response(JSON.stringify({ error: 'vendedor_id y producto_id requeridos' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    let viewerId: number | null = null;
    const auth = request.headers.get('Authorization');
    if (auth && auth.startsWith('Bearer ')) {
      try {
        const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
        viewerId = payload.id;
      } catch {}
    }

    if (viewerId && viewerId === vendedor_id) {
      return new Response(JSON.stringify({ success: true, counted: false }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const viewerIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';

    const existing = db.prepare(
      'SELECT id FROM vistas_vendedor WHERE vendedor_id = ? AND producto_id = ? AND (viewer_id = ? OR viewer_ip = ?) LIMIT 1'
    ).get(vendedor_id, producto_id, viewerId, viewerIp) as any;

    if (!existing) {
      db.prepare(
        'INSERT INTO vistas_vendedor (vendedor_id, producto_id, viewer_id, viewer_ip) VALUES (?, ?, ?, ?)'
      ).run(vendedor_id, producto_id, viewerId, viewerIp);
    }

    return new Response(JSON.stringify({ success: true, counted: !existing }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error registrando vista:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
