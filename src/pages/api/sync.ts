import type { APIRoute } from 'astro';
import { queryRun } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    if (!body || body.trim() === '') {
      return new Response(JSON.stringify({ error: 'Datos vacíos' }), { status: 400 });
    }

    let data: any;
    try {
      data = JSON.parse(body);
    } catch {
      return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
    }

    if (!data.productos || !Array.isArray(data.productos)) {
      return new Response(JSON.stringify({ error: 'Formato inválido' }), { status: 400 });
    }

    const inserted: number[] = [];

    for (const p of data.productos) {
      const placeholderImg = p.imagenes?.[0] || '/images/ganado.svg';
      const imgsToInsert = p.imagenes?.length ? p.imagenes : [placeholderImg];
      const vendedorId = p.vendedor_id || null;
      const catSlug = (p.categoria || '').toLowerCase();
      const catSlugMap: Record<string, number> = {};
      const cats = await queryAll<{ id: number; slug: string }>('SELECT id, slug FROM categorias');
      for (const c of cats) catSlugMap[c.slug] = c.id;
      const catId = catSlugMap[catSlug] || catSlugMap[catSlug.replace(/s$/, '')] || null;
      const { lastInsertRowid: newId } = await queryRun(
        `INSERT INTO productos (
          nombre, categoria_id, raza, peso, peso_unitario, ubicacion, departamento,
          precio, precio_anterior, stock, vendedor_id, vendedor_rating,
          estado, salud, envio, destacado, oferta, trazabilidad
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.nombre,
          catId,
          p.raza || null,
          p.peso ? parseFloat(p.peso) : null,
          null,
          p.ubicacion,
          p.departamento,
          parseFloat(p.precio) || 0,
          null,
          parseInt(p.stock) || 1,
          vendedorId,
          4.5,
          'disponible',
          p.salud || 'Bueno',
          true,
          false,
          false,
          false,
        ]
      );

      for (let i = 0; i < imgsToInsert.length; i++) {
        await queryRun('INSERT INTO imagenes_producto (producto_id, url, orden) VALUES (?, ?, ?)', [newId, imgsToInsert[i], i]);
      }

      inserted.push(newId);
    }

    return new Response(JSON.stringify({ success: true, inserted: inserted.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};