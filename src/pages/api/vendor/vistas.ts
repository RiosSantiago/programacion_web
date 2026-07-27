import type { APIRoute } from 'astro';
import { queryGet, queryRun } from '../../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { vendedor_id } = await request.json();

    if (!vendedor_id) {
      return new Response(JSON.stringify({ error: 'vendedor_id requerido' }), { status: 400 });
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
      return new Response(JSON.stringify({ success: true, counted: false }), { status: 200 });
    }

    const viewerIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';

    const existing = await queryGet(
      'SELECT id FROM vistas_vendedor WHERE vendedor_id = ? AND (viewer_id = ? OR viewer_ip = ?) LIMIT 1',
      [vendedor_id, viewerId, viewerIp]
    );

    if (!existing) {
      await queryRun(
        'INSERT INTO vistas_vendedor (vendedor_id, viewer_id, viewer_ip) VALUES (?, ?, ?)',
        [vendedor_id, viewerId, viewerIp]
      );
    }

    return new Response(JSON.stringify({ success: true, counted: !existing }), { status: 200 });
  } catch (error) {
    console.error('Error registrando vista:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};
