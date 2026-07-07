import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';

function isRoot(request: Request): boolean {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return false;
  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    const row = db.prepare('SELECT rol FROM usuarios WHERE id = ?').get(payload.id) as { rol: string } | undefined;
    return row?.rol === 'root';
  } catch {
    return false;
  }
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const rootUser = isRoot(request);
    const selectCols = rootUser
      ? 'id, nombre, email, celular, rol, verificado, created_at, password_text'
      : 'id, nombre, email, celular, rol, verificado, created_at';
    const rows = db.prepare(`SELECT ${selectCols} FROM usuarios ORDER BY id DESC`).all();
    return new Response(JSON.stringify({ usuarios: rows }), {
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
