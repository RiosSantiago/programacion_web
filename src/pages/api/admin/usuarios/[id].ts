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
    const id = parseInt(params.id || '');
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();

    if (data.rol !== undefined && !['', 'admin'].includes(data.rol)) {
      return new Response(JSON.stringify({ error: 'Rol inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.rol === 'root') {
      return new Response(JSON.stringify({ error: 'No se puede asignar el rol root' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const requestorRole = getRequestRole(request);
    if (data.rol !== undefined && requestorRole !== 'root') {
      return new Response(JSON.stringify({ error: 'Solo root puede cambiar roles' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fields: string[] = [];
    const paramsArr: any[] = [];

    if (data.rol !== undefined) { fields.push('rol = ?'); paramsArr.push(data.rol); }
    if (data.nombre) { fields.push('nombre = ?'); paramsArr.push(data.nombre); }
    if (data.verificado !== undefined) { fields.push('verificado = ?'); paramsArr.push(data.verificado ? 1 : 0); }

    if (fields.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay campos para actualizar' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    paramsArr.push(id);
    db.prepare(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`).run(...paramsArr);

    const updated = db.prepare('SELECT id, nombre, email, celular, rol, verificado, created_at FROM usuarios WHERE id = ?').get(id);

    return new Response(JSON.stringify({ success: true, usuario: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const requestorRole = getRequestRole(request);
    if (requestorRole !== 'root') {
      return new Response(JSON.stringify({ error: 'Solo root puede eliminar usuarios' }), {
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

    db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
