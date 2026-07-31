import type { APIRoute } from 'astro';
import { queryGet, queryRun } from '../../../lib/db';

async function getUserId(request: Request): Promise<number | null> {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    return payload.id || null;
  } catch {
    return null;
  }
}

async function getUserRole(userId: number): Promise<string | null> {
  const row = await queryGet<{ rol: string }>('SELECT rol FROM usuarios WHERE id = ?', [userId]);
  return row?.rol || null;
}

export const GET: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id || '');
    if (!id) return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });

    const product = await queryGet<any>(
      `SELECT p.id, p.nombre, p.categoria_id, p.raza, p.peso, p.peso_unitario,
              p.ubicacion, p.departamento, p.precio, p.precio_anterior, p.stock,
              p.vendedor_id, p.vendedor_rating, p.estado, p.salud, p.envio,
              p.destacado, p.oferta, p.trazabilidad, p.tipo_precio, p.sexo,
              p.fecha_nacimiento, p.descripcion, p.video, p.finca, p.vereda,
              p.referencia_ubicacion, p.ica_pdf, p.created_at,
              u.nombre AS vendedor,
              COALESCE(c.slug, p.categoria) AS categoria,
              c.nombre AS categoria_nombre
       FROM productos p
       LEFT JOIN usuarios u ON p.vendedor_id = u.id
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.id = ?`,
      [id]
    );
    if (!product) return new Response(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404 });

    const imgRows = await queryGet<any[]>('SELECT url FROM imagenes_producto WHERE producto_id = ? ORDER BY orden ASC', [id]);
    const imagenes: string[] = Array.isArray(imgRows) ? imgRows.map(i => i.url) : [];

    return new Response(JSON.stringify({
      producto: { ...product, imagenes, imagen: imagenes[0] || '/images/ganado.svg' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const userId = await getUserId(request);
    if (!userId) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

    const id = parseInt(params.id || '');
    if (!id) return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });

    const rol = await getUserRole(userId);
    const SELECT_PROD = `SELECT p.id, p.nombre, p.categoria_id, p.raza, p.peso, p.peso_unitario,
      p.ubicacion, p.departamento, p.precio, p.precio_anterior, p.stock,
      p.vendedor_id, p.vendedor_rating, p.estado, p.salud, p.envio,
      p.destacado, p.oferta, p.trazabilidad, p.tipo_precio, p.sexo,
      p.fecha_nacimiento, p.descripcion, p.video, p.finca, p.vereda,
      p.referencia_ubicacion, p.ica_pdf, p.created_at,
      u.nombre AS vendedor,
      COALESCE(c.slug, p.categoria) AS categoria,
      c.nombre AS categoria_nombre
      FROM productos p LEFT JOIN usuarios u ON p.vendedor_id = u.id
      LEFT JOIN categorias c ON p.categoria_id = c.id`;
    const canEditAny = rol === 'root' || rol === 'admin';
    const product = canEditAny
      ? await queryGet<any>(`${SELECT_PROD} WHERE p.id = ?`, [id])
      : await queryGet<any>(`${SELECT_PROD} WHERE p.id = ? AND (p.vendedor_id = ? OR p.vendedor_id IS NULL)`, [id, userId]);

    if (!product) return new Response(JSON.stringify({ error: 'Producto no encontrado o no autorizado' }), { status: 404 });

    const data = await request.json();
    const fields: string[] = [];
    const paramsArr: any[] = [];

    const allowedFields = [
      'nombre', 'raza', 'peso', 'ubicacion', 'departamento', 'precio', 'stock',
      'salud', 'estado', 'tipo_precio', 'sexo', 'fecha_nacimiento', 'descripcion', 'video',
      'finca', 'vereda', 'referencia_ubicacion', 'certificaciones',
    ];

    if (data.nombre_finca !== undefined && data.finca === undefined)           data.finca = data.nombre_finca;
    if (data.referencia   !== undefined && data.referencia_ubicacion === undefined) data.referencia_ubicacion = data.referencia;

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        let val = data[field];
        if (field === 'descripcion') val = String(val).slice(0, 500);
        if (field === 'certificaciones') val = JSON.stringify(val);
        paramsArr.push(val);
      }
    }
    if (data.imagenes !== undefined && Array.isArray(data.imagenes)) {
      await queryRun('DELETE FROM imagenes_producto WHERE producto_id = ?', [id]);
      for (let i = 0; i < data.imagenes.length; i++) {
        await queryRun('INSERT INTO imagenes_producto (producto_id, url, orden) VALUES (?, ?, ?)', [id, data.imagenes[i], i]);
      }
    }
    if (fields.length === 0 && !Array.isArray(data.imagenes)) return new Response(JSON.stringify({ error: 'No hay campos para actualizar' }), { status: 400 });

    if (fields.length > 0) {
      paramsArr.push(id);
      await queryRun(`UPDATE productos SET ${fields.join(', ')} WHERE id = ?`, paramsArr);
    }

    const updated = await queryGet<any>(
      `${SELECT_PROD} WHERE p.id = ?`,
      [id]
    );

    const imgRows = await queryGet<any[]>('SELECT url FROM imagenes_producto WHERE producto_id = ? ORDER BY orden ASC', [id]);
    const imagenes: string[] = Array.isArray(imgRows) ? imgRows.map(i => i.url) : [];

    return new Response(JSON.stringify({
      success: true,
      producto: { ...updated, imagenes, imagen: imagenes[0] || '/images/ganado.svg' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const userId = await getUserId(request);
    if (!userId) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

    const id = parseInt(params.id || '');
    if (!id) return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });

    const rol = await getUserRole(userId);
    const product = rol === 'root'
      ? await queryGet<any>('SELECT id FROM productos WHERE id = ?', [id])
      : await queryGet<any>('SELECT id FROM productos WHERE id = ? AND (vendedor_id = ? OR vendedor_id IS NULL)', [id, userId]);

    if (!product) return new Response(JSON.stringify({ error: 'Producto no encontrado o no autorizado' }), { status: 404 });

    await queryRun('DELETE FROM productos WHERE id = ?', [id]);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};
