import type { APIRoute } from 'astro';
import { queryAll } from '../../lib/db';
import { getImagenesMap } from '../../lib/models/productos';

export const GET: APIRoute = async ({ url }) => {
  try {
    const q = url.searchParams.get('q') || '';

    let sqlQuery = `
      SELECT p.id, p.nombre, p.categoria, p.categoria_id AS "categoriaId", p.raza,
             p.peso, p.peso_unitario AS "pesoUnitario",
             p.ubicacion, p.departamento, p.precio, p.precio_anterior AS "precioAnterior",
             p.stock,
             u.nombre AS vendedor,
             p.vendedor_rating AS "vendedorRating", p.imagenes,
             p.estado, p.salud, p.envio, p.destacado, p.oferta, p.trazabilidad,
             p.descripcion, p.vendedor_id,
             p.created_at AS "createdAt"
      FROM productos p
      LEFT JOIN usuarios u ON p.vendedor_id = u.id
    `;
    const params: any[] = [];

    if (q.trim()) {
      const searchTerm = `%${q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}%`;
      sqlQuery += ` WHERE (
        p.nombre ILIKE ? OR
        COALESCE(p.raza, '') ILIKE ? OR
        u.nombre ILIKE ? OR
        p.ubicacion ILIKE ? OR
        p.categoria ILIKE ? OR
        COALESCE(p.descripcion, '') ILIKE ?
      )`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sqlQuery += ' ORDER BY p.created_at DESC';


    const rows = await queryAll(sqlQuery, params);
    const ids = rows.map((r: any) => r.id);
    const imgMap = await getImagenesMap(ids);

    const productos = rows.map((p: any) => {
      const imagenes = imgMap[p.id] || (typeof p.imagenes === 'string' ? JSON.parse(p.imagenes) : (Array.isArray(p.imagenes) ? p.imagenes : []));
      return {
        ...p,
        imagenes,
        imagen: imagenes[0] || '/images/ganado.svg',
      };
    });

    return new Response(JSON.stringify({ productos, fuente: 'postgresql' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};