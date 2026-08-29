import type { APIRoute } from 'astro';
import { queryAll } from '../../../lib/db';
import { getImagenesMap } from '../../../lib/models/productos';
import { getAuthContext, unauthorized, forbidden } from '../../../lib/rbac';

export const GET: APIRoute = async ({ request }) => {
  try {
    const ctx = await getAuthContext(request);
    if (!ctx) return unauthorized();
    if (ctx.rol !== 'root' && ctx.rol !== 'admin') return forbidden();

    const url = new URL(request.url);
    const limit  = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 100);
    const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0);

    const rows = await queryAll(
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
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
       [limit, offset]
     );
    const totalRes = await queryAll<{ total: number }>('SELECT COUNT(*)::int AS total FROM productos');
    const total = Number(totalRes[0]?.total ?? 0);
    const ids = rows.map((r: any) => r.id);
    const imgMap = await getImagenesMap(ids);

    const productos = rows.map((row: any) => {
      const imagenes = imgMap[row.id] || (typeof row.imagenes === 'string' ? JSON.parse(row.imagenes) : []);
      return {
        ...row,
        imagenes,
        imagen:       imagenes[0] || '/images/ganado.svg',
        destacado:    Boolean(row.destacado),
        oferta:       Boolean(row.oferta),
        trazabilidad: Boolean(row.trazabilidad),
        envio:        Boolean(row.envio),
      };
    });

    return new Response(JSON.stringify({ productos, total, limit, offset }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
