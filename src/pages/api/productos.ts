import type { APIRoute } from 'astro';
import { queryAll } from '../../lib/db';
import { getImagenesMap } from '../../lib/models/productos';

export const GET: APIRoute = async ({ url }) => {
  try {
    const q = url.searchParams.get('q') || '';
    const limit  = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 100);
    const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0);
    const searchTerm = q.trim()
      ? `%${q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}%`
      : '';

    let sqlQuery = `
      SELECT p.id, p.nombre, p.categoria_id AS "categoriaId", p.raza,
             p.peso, p.peso_unitario AS "pesoUnitario",
             p.ubicacion, p.departamento, p.precio, p.precio_unitario AS "precioUnitario", p.precio_unitario, p.precio_anterior AS "precioAnterior",
             p.stock,
             u.nombre AS vendedor,
             p.vendedor_rating AS "vendedorRating",
             p.estado, p.salud, p.envio, p.destacado, p.oferta, p.trazabilidad,
             p.descripcion, p.vendedor_id,
             p.transporte,
             p.created_at AS "createdAt",
             COALESCE(c.slug, p.categoria) AS categoria,
             c.nombre AS categoria_nombre
      FROM productos p
      LEFT JOIN usuarios u ON p.vendedor_id = u.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
    `;
    const params: any[] = [];

    if (searchTerm) {
      sqlQuery += ` WHERE (
        p.nombre ILIKE ? OR
        COALESCE(p.raza, '') ILIKE ? OR
        u.nombre ILIKE ? OR
        p.ubicacion ILIKE ? OR
        c.nombre ILIKE ? OR
        COALESCE(p.descripcion, '') ILIKE ?
      )`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sqlQuery += ' ORDER BY p.created_at DESC';
    sqlQuery += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    let totalSql = `
      SELECT COUNT(*)::int AS total
      FROM productos p
      LEFT JOIN usuarios u ON p.vendedor_id = u.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
    `;
    const totalParams: any[] = [];
    if (searchTerm) {
      totalSql += ` WHERE (
        p.nombre ILIKE ? OR COALESCE(p.raza, '') ILIKE ? OR u.nombre ILIKE ? OR
        p.ubicacion ILIKE ? OR c.nombre ILIKE ? OR COALESCE(p.descripcion, '') ILIKE ?
      )`;
      totalParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    const totalRes = await queryAll<{ total: number }>(totalSql, totalParams);
    const total = Number(totalRes[0]?.total ?? 0);

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

    return new Response(JSON.stringify({ productos, fuente: 'postgresql', total, limit, offset }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al listar productos:', error);
    return new Response(JSON.stringify({ error: 'Ocurrió un error, intenta de nuevo' }), { status: 500 });
  }
};