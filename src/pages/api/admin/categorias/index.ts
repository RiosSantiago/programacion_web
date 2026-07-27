import type { APIRoute } from 'astro';
import { queryAll, queryGet, queryRun } from '../../../../lib/db';

export const GET: APIRoute = async () => {
  try {
    const categorias = await queryAll('SELECT * FROM categorias ORDER BY id ASC');
    return new Response(JSON.stringify({ categorias }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};

async function getRequestRole(request: Request): Promise<string | null> {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    const row = await queryGet<{ rol: string }>('SELECT rol FROM usuarios WHERE id = ?', [payload.id]);
    return row?.rol || null;
  } catch {
    return null;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if ((await getRequestRole(request)) !== 'root') {
      return new Response(JSON.stringify({ error: 'Solo root puede crear categorías' }), { status: 403 });
    }
    const data = await request.json();
    if (!data.nombre || !data.icono || !data.color) {
      return new Response(JSON.stringify({ error: 'nombre, icono y color son requeridos' }), { status: 400 });
    }

    const { lastInsertRowid: newId } = await queryRun(
      'INSERT INTO categorias (nombre, icono, color, cantidad) VALUES (?, ?, ?, ?)',
      [data.nombre, data.icono, data.color, data.cantidad || 0]
    );

    return new Response(JSON.stringify({ success: true, id: newId }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};
