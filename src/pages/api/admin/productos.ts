import type { APIRoute } from 'astro';
import { queryAll, queryGet } from '../../../lib/db';
import { getImagenesMap } from '../../../lib/models/productos';

async function isRootOrAdmin(userId: number): Promise<boolean> {
  const row = await queryGet<{ rol: string }>('SELECT rol FROM usuarios WHERE id = ?', [userId]);
  return row?.rol === 'root' || row?.rol === 'admin';
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const auth = request.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    let payload: { id: number };
    try {
      payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    } catch {
      return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401 });
    }

    if (!(await isRootOrAdmin(payload.id))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403 });
    }

    const rows = await queryAll(
      `SELECT p.id, p.nombre, p.categoria_id, p.raza, p.peso, p.peso_unitario,
              p.ubicacion, p.departamento, p.precio, p.precio_anterior, p.stock,
              p.vendedor_id, p.vendedor_rating, p.estado, p.salud, p.envio,
              p.destacado, p.oferta, p.trazabilidad, p.tipo_precio, p.sexo,
              p.fecha_nacimiento, p.descripcion, p.video, p.finca, p.vereda,
              p.referencia_ubicacion, p.ica_pdf, p.created_at,
              u.nombre AS vendedor,
              c.slug AS categoria,
              c.nombre AS categoria_nombre
       FROM productos p
       LEFT JOIN usuarios u ON p.vendedor_id = u.id
       LEFT JOIN categorias c ON p.categoria_id = c.id
       ORDER BY p.id DESC`
     );
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

    return new Response(JSON.stringify({ productos }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};
