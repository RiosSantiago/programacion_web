import type { APIRoute } from 'astro';
import { queryAll, queryGet, queryRun } from '../../../../lib/db';
import { getAuthContext, unauthorized, forbidden } from '../../../../lib/rbac';

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const ctx = await getAuthContext(request);
    if (!ctx) return unauthorized();
    if (ctx.rol !== 'root' && ctx.rol !== 'admin') return forbidden();

    const id = parseInt(params.id || '');
    if (!id) return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });

    const data = await request.json();

    if (data.rol !== undefined && !['', 'comprador', 'vendedor', 'admin'].includes(data.rol)) {
      return new Response(JSON.stringify({ error: 'Rol inválido' }), { status: 400 });
    }
    if (data.rol === 'root') {
      return new Response(JSON.stringify({ error: 'No se puede asignar el rol root' }), { status: 403 });
    }
    if (data.rol !== undefined && ctx.rol !== 'root') {
      return forbidden('Solo root puede cambiar roles');
    }

    const fields: string[] = [];
    const paramsArr: any[] = [];

    if (data.rol !== undefined) { fields.push('rol = ?'); paramsArr.push(data.rol === '' ? 'comprador' : data.rol); }
    if (data.nombre) { fields.push('nombre = ?'); paramsArr.push(data.nombre); }
    if (data.verificado !== undefined) { fields.push('verificado = ?'); paramsArr.push(Boolean(data.verificado)); }

    if (fields.length === 0) return new Response(JSON.stringify({ error: 'No hay campos para actualizar' }), { status: 400 });

    paramsArr.push(id);
    await queryRun(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, paramsArr);

    const updated = await queryGet('SELECT id, nombre, email, celular, rol, verificado, created_at FROM usuarios WHERE id = ?', [id]);

    return new Response(JSON.stringify({ success: true, usuario: updated }), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const ctx = await getAuthContext(request);
    if (!ctx) return unauthorized();
    if (ctx.rol !== 'root') return forbidden('Solo root puede eliminar usuarios');

    const id = parseInt(params.id || '');
    if (!id) return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });

    await queryRun('DELETE FROM usuarios WHERE id = ?', [id]);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
