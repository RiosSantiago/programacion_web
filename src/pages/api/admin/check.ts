import type { APIRoute } from 'astro';
import { queryGet } from '../../../lib/db';
import { getTokenFromRequest } from '../../../lib/auth';

export const GET: APIRoute = async ({ request }) => {
  const tokenPayload = getTokenFromRequest(request);
  if (!tokenPayload) {
    return new Response(JSON.stringify({ admin: false }), { status: 200 });
  }

  try {
    const user = await queryGet<any>('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?', [tokenPayload.id]);
    if (user && (user.rol === 'root' || user.rol === 'admin')) {
      return new Response(JSON.stringify({ admin: true, user }), { status: 200 });
    }
  } catch {}

  return new Response(JSON.stringify({ admin: false }), { status: 200 });
};
