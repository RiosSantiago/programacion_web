import type { APIRoute } from 'astro';
import { queryGet, queryRun } from '../../../../lib/db';

async function getRequestRole(request: Request): Promise<string | null> {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    const row = await queryGet<{ rol: string }>('SELECT rol FROM usuarios WHERE id = ?', [payload.id]);
    return row?.rol || null;
  } catch {
    return null;
  }
}

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = parseInt(params.id || '');
    if (!id) return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });

    const data = await request.json();

    if (data.rol !== undefined && !['', 'comprador', 'vendedor', 'admin'].includes(data.rol)) {
      return new Response(JSON.stringify({ error: 'Rol inválido' }), { status: 400 });
    }
    if (data.rol === 'root') {
      return new Response(JSON.stringify({ error: 'No se puede asignar el rol root' }), { status: 403 });
    }

    const requestorRole = await getRequestRole(request);
    if (data.rol !== undefined && requestorRole !== 'root') {
      return new Response(JSON.stringify({ error: 'Solo root puede cambiar roles' }), { status: 403 });
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
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const requestorRole = await getRequestRole(request);
    if (requestorRole !== 'root') {
      return new Response(JSON.stringify({ error: 'Solo root puede eliminar usuarios' }), { status: 403 });
    }
    const id = parseInt(params.id || '');
    if (!id) return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });

    await queryRun('DELETE FROM usuarios WHERE id = ?', [id]);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};
