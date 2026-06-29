import type { APIRoute } from 'astro';
import { db } from '../../lib/db';

export const GET: APIRoute = async () => {
  try {
    // Get from SQLite
    const stmt = db.prepare(`
      SELECT id, nombre, categoria, raza, peso, peso_unitario as pesoUnitario, 
             ubicacion, departamento, precio, precio_anterior as precioAnterior,
             stock, vendedor, vendedor_rating as vendedorRating, imagenes,
             estado, salud, envio, destacado, oferta, trazabilidad,
             descripcion, vendedor_id,
             created_at as createdAt
      FROM productos 
      ORDER BY created_at DESC
    `);
    
    const sqliteProducts = stmt.all();

    return new Response(JSON.stringify({ productos: sqliteProducts, fuente: 'sqlite' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};