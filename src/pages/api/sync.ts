import type { APIRoute } from 'astro';
import { queryAll, queryRun } from '../../lib/db';
import { getTokenFromRequest } from '../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const tokenPayload = getTokenFromRequest(request);
    if (!tokenPayload) {
      return new Response(JSON.stringify({ error: 'Debes iniciar sesión para sincronizar productos.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }
    const userId = tokenPayload.id;

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
      // vendedor_id SIEMPRE proviene de la sesión autenticada, nunca del body.
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
          userId,
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
    console.error('Error al sincronizar productos:', error);
    return new Response(JSON.stringify({ error: 'Ocurrió un error, intenta de nuevo' }), { status: 500 });
  }
};