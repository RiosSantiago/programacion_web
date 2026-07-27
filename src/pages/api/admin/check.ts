import type { APIRoute } from 'astro';
import { queryGet } from '../../../lib/db';

export const GET: APIRoute = async ({ request }) => {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ admin: false }), { status: 200 });
  }

  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    const user = await queryGet<any>('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?', [payload.id]);
    if (user && (user.rol === 'root' || user.rol === 'admin')) {
      return new Response(JSON.stringify({ admin: true, user }), { status: 200 });
    }
  } catch {}

  return new Response(JSON.stringify({ admin: false }), { status: 200 });
};
