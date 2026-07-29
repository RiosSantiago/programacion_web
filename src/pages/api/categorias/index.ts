import type { APIRoute } from 'astro';
import { getCategorias } from '../../../lib/models/categorias';

export const GET: APIRoute = async () => {
  try {
    const categorias = await getCategorias();
    return new Response(JSON.stringify({ categorias }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};
