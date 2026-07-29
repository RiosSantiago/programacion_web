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
    if ((await getRequestRole(request)) !== 'root') {
      return new Response(JSON.stringify({ error: 'Solo root puede editar categorías' }), { status: 403 });
    }
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
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    if ((await getRequestRole(request)) !== 'root') {
      return new Response(JSON.stringify({ error: 'Solo root puede eliminar categorías' }), { status: 403 });
    }
    const id = parseInt(params.id || '');
    if (!id) return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });

    await queryRun('DELETE FROM categorias WHERE id = ?', [id]);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};
