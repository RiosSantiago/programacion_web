import type { APIRoute } from 'astro';
import { queryRun, queryGet } from '../../../../lib/db';
import { generarSlug, getCategorias } from '../../../../lib/models/categorias';
import { getRequestRole, forbidden } from '../../../../lib/rbac';

export const GET: APIRoute = async () => {
  try {
    const categorias = await getCategorias();
    return new Response(JSON.stringify({ categorias }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const rol = await getRequestRole(request);
    if (rol !== 'root') return forbidden('Solo root puede crear categorías');

    const data = await request.json();
    if (!data.nombre || !data.icono || !data.color) {
      return new Response(JSON.stringify({ error: 'nombre, icono y color son requeridos' }), { status: 400 });
    }

    const slug = data.slug || generarSlug(data.nombre);
    const { lastInsertRowid: newId } = await queryRun(
      'INSERT INTO categorias (nombre, slug, icono, color, cantidad) VALUES (?, ?, ?, ?, ?)',
      [data.nombre, slug, data.icono, data.color, data.cantidad || 0]
    );

    return new Response(JSON.stringify({ success: true, id: newId }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
