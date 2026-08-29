import type { APIRoute } from 'astro';
import { queryRun } from '../../../../lib/db';
import { getRequestRole, unauthorized, forbidden } from '../../../../lib/rbac';

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const rol = await getRequestRole(request);
    if (rol !== 'root') return forbidden('Solo root puede editar categorías');

    const id = parseInt(params.id || '');
    if (!id) return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });

    const data = await request.json();
    const fields: string[] = [];
    const paramsArr: any[] = [];

    if (data.nombre) { fields.push('nombre = ?'); paramsArr.push(data.nombre); }
    if (data.slug) { fields.push('slug = ?'); paramsArr.push(data.slug); }
    if (data.icono) { fields.push('icono = ?'); paramsArr.push(data.icono); }
    if (data.color) { fields.push('color = ?'); paramsArr.push(data.color); }
    if (data.cantidad !== undefined) { fields.push('cantidad = ?'); paramsArr.push(data.cantidad); }

    if (fields.length === 0) return new Response(JSON.stringify({ error: 'No hay campos para actualizar' }), { status: 400 });

    paramsArr.push(id);
    await queryRun(`UPDATE categorias SET ${fields.join(', ')} WHERE id = ?`, paramsArr);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const rol = await getRequestRole(request);
    if (rol !== 'root') return forbidden('Solo root puede eliminar categorías');

    const id = parseInt(params.id || '');
    if (!id) return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });

    await queryRun('DELETE FROM categorias WHERE id = ?', [id]);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
