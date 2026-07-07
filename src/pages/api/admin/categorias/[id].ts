import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';

function getRequestRole(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    const row = db.prepare('SELECT rol FROM usuarios WHERE id = ?').get(payload.id) as { rol: string } | undefined;
    return row?.rol || null;
  } catch {
    return null;
  }
}

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    if (getRequestRole(request) !== 'root') {
      return new Response(JSON.stringify({ error: 'Solo root puede editar categorías' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const id = parseInt(params.id || '');
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();
    const fields: string[] = [];
    const paramsArr: any[] = [];

    if (data.nombre) { fields.push('nombre = ?'); paramsArr.push(data.nombre); }
    if (data.icono) { fields.push('icono = ?'); paramsArr.push(data.icono); }
    if (data.color) { fields.push('color = ?'); paramsArr.push(data.color); }
    if (data.cantidad !== undefined) { fields.push('cantidad = ?'); paramsArr.push(data.cantidad); }

    if (fields.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay campos para actualizar' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    paramsArr.push(id);
    db.prepare(`UPDATE categorias SET ${fields.join(', ')} WHERE id = ?`).run(...paramsArr);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    if (getRequestRole(request) !== 'root') {
      return new Response(JSON.stringify({ error: 'Solo root puede eliminar categorías' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const id = parseInt(params.id || '');
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    db.prepare('DELETE FROM categorias WHERE id = ?').run(id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
