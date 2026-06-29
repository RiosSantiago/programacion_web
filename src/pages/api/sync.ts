import type { APIRoute } from 'astro';
import { db, inicializar } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    
    if (!body || body.trim() === '') {
      return new Response(JSON.stringify({ error: 'Datos vacíos' }), { status: 400 });
    }

    let data;
    try {
      data = JSON.parse(body);
    } catch {
      return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
    }

    if (!data.productos || !Array.isArray(data.productos)) {
      return new Response(JSON.stringify({ error: 'Formato inválido' }), { status: 400 });
    }

    inicializar();

    const stmt = db.prepare(`
      INSERT INTO productos (
        nombre, categoria, raza, peso, peso_unitario, ubicacion, departamento,
        precio, precio_anterior, stock, vendedor, vendedor_rating, imagenes,
        estado, salud, envio, destacado, oferta, trazabilidad
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const inserted: number[] = [];
    
    for (const p of data.productos) {
      const placeholderImg = p.imagenes?.[0] || '/images/ganado.svg';
      
      stmt.run(
        p.nombre,
        p.categoria,
        p.raza || null,
        p.peso ? parseFloat(p.peso) : null,
        null,
        p.ubicacion,
        p.departamento,
        parseFloat(p.precio) || 0,
        null,
        parseInt(p.stock) || 1,
        'Mi Hacienda',
        4.5,
        placeholderImg,
        'disponible',
        p.salud || 'Bueno',
        1,
        0,
        0,
        0
      );
      
      const lastId = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
      inserted.push(lastId.id);
    }

    return new Response(JSON.stringify({ success: true, inserted: inserted.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};