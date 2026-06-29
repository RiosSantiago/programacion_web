import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';

export const GET: APIRoute = async ({ request }) => {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ admin: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    const user = db.prepare('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?').get(payload.id) as any;
    if (user && (user.rol === 'root' || user.rol === 'admin')) {
      return new Response(JSON.stringify({ admin: true, user }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {}

  return new Response(JSON.stringify({ admin: false }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
