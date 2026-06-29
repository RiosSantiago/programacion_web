import type { APIRoute } from 'astro';
import { db, inicializar } from '../../../lib/db';

function getUserId(request: Request): number | null {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    return payload.id || null;
  } catch {
    return null;
  }
}

function getUserRole(userId: number): string | null {
  try {
    const row = db.prepare('SELECT rol FROM usuarios WHERE id = ?').get(userId) as { rol: string } | undefined;
    return row?.rol || null;
  } catch {
    return null;
  }
}

function isRoot(userId: number): boolean {
  try {
    const row = db.prepare('SELECT rol FROM usuarios WHERE id = ?').get(userId) as { rol: string } | undefined;
    return row?.rol === 'root';
  } catch {
    return false;
  }
}

function isAdmin(userId: number): boolean {
  try {
    const row = db.prepare('SELECT rol FROM usuarios WHERE id = ?').get(userId) as { rol: string } | undefined;
    return row?.rol === 'admin';
  } catch {
    return false;
  }
}

export const GET: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id || '');
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const product = db.prepare('SELECT * FROM productos WHERE id = ?').get(id) as any;
    if (!product) {
      return new Response(JSON.stringify({ error: 'Producto no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let imagenes: string[] = [];
    try { imagenes = JSON.parse(product.imagenes); } catch { imagenes = []; }

    return new Response(JSON.stringify({
      producto: { ...product, imagenes, imagen: imagenes[0] || '/images/ganado.svg' },
    }), {
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

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
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

    const userIsRoot = isRoot(userId);
    const userIsAdmin = isAdmin(userId);
    const canEditAny = userIsRoot || userIsAdmin;
    const product = canEditAny
      ? db.prepare('SELECT * FROM productos WHERE id = ?').get(id) as any
      : db.prepare('SELECT * FROM productos WHERE id = ? AND (vendedor_id = ? OR vendedor_id IS NULL)').get(id, userId) as any;

    if (!product) {
      return new Response(JSON.stringify({ error: 'Producto no encontrado o no autorizado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();
    const fields: string[] = [];
    const paramsArr: any[] = [];

    const allowedFields = ['nombre', 'categoria', 'raza', 'peso', 'ubicacion', 'departamento', 'precio', 'stock', 'salud', 'estado', 'tipo_precio', 'sexo', 'fecha_nacimiento', 'descripcion', 'video'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        paramsArr.push(field === 'descripcion' ? String(data[field]).slice(0, 100) : data[field]);
      }
    }

    if (data.imagenes !== undefined) {
      fields.push('imagenes = ?');
      paramsArr.push(JSON.stringify(data.imagenes));
    }

    if (fields.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay campos para actualizar' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    paramsArr.push(id);
    db.prepare(`UPDATE productos SET ${fields.join(', ')} WHERE id = ?`).run(...paramsArr);

    const updated = db.prepare('SELECT * FROM productos WHERE id = ?').get(id) as any;
    let imagenes: string[] = [];
    try { imagenes = JSON.parse(updated.imagenes); } catch { imagenes = []; }

    return new Response(JSON.stringify({
      success: true,
      producto: { ...updated, imagenes, imagen: imagenes[0] || '/images/ganado.svg' },
    }), {
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
    const userId = getUserId(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
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

    const userIsRoot = isRoot(userId);
    const product = userIsRoot
      ? db.prepare('SELECT * FROM productos WHERE id = ?').get(id) as any
      : db.prepare('SELECT * FROM productos WHERE id = ? AND (vendedor_id = ? OR vendedor_id IS NULL)').get(id, userId) as any;

    if (!product) {
      return new Response(JSON.stringify({ error: 'Producto no encontrado o no autorizado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    db.prepare('DELETE FROM productos WHERE id = ?').run(id);

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
