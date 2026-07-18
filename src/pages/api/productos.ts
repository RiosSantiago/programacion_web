import type { APIRoute } from 'astro';
import { db } from '../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  try {
    const q = url.searchParams.get('q') || '';

    let sqlQuery = `
      SELECT id, nombre, categoria, raza, peso, peso_unitario as pesoUnitario, 
             ubicacion, departamento, precio, precio_anterior as precioAnterior,
             stock, vendedor, vendedor_rating as vendedorRating, imagenes,
             estado, salud, envio, destacado, oferta, trazabilidad,
             descripcion, vendedor_id,
             created_at as createdAt
      FROM productos
    `;
    const params: any[] = [];

    if (q.trim()) {
      // Normalize: lowercase + strip accents for robust matching
      const normalized = q.trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const searchTerm = `%${normalized}%`;
      sqlQuery += ` WHERE (
        LOWER(nombre) LIKE ? OR
        LOWER(COALESCE(raza, '')) LIKE ? OR
        LOWER(vendedor) LIKE ? OR
        LOWER(ubicacion) LIKE ? OR
        LOWER(categoria) LIKE ? OR
        LOWER(COALESCE(descripcion, '')) LIKE ?
      )`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sqlQuery += ' ORDER BY created_at DESC';

    const stmt = db.prepare(sqlQuery);
    const sqliteProducts = params.length > 0 ? stmt.all(...params) : stmt.all();

    return new Response(JSON.stringify({ productos: sqliteProducts, fuente: 'sqlite' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};