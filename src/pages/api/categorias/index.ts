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
    console.error('Error al listar categorías:', error);
    return new Response(JSON.stringify({ error: 'Ocurrió un error, intenta de nuevo' }), { status: 500 });
  }
};
