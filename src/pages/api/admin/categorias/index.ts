import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';

export const GET: APIRoute = async () => {
  try {
    const categorias = db.prepare('SELECT * FROM categorias ORDER BY id ASC').all();
    return new Response(JSON.stringify({ categorias }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function getRequestRole(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    const row = db.prepare('SELECT rol FROM usuarios WHERE id = ?').get(payload.id) as { rol: string } | undefined;
    return row?.rol || null;
  } catch {
    return null;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (getRequestRole(request) !== 'root') {
      return new Response(JSON.stringify({ error: 'Solo root puede crear categorías' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const data = await request.json();
    if (!data.nombre || !data.icono || !data.color) {
      return new Response(JSON.stringify({ error: 'nombre, icono y color son requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cantidad = data.cantidad || 0;

    db.prepare(
      'INSERT INTO categorias (nombre, icono, color, cantidad) VALUES (?, ?, ?, ?)'
    ).run(data.nombre, data.icono, data.color, cantidad);

    const lastId = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };

    return new Response(JSON.stringify({ success: true, id: lastId.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
