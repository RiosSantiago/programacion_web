import type { APIRoute } from 'astro';
import { db, inicializar } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    
    if (!body || body.trim() === '') {
      return new Response(JSON.stringify({ error: 'Datos vacíos', body: body }), { status: 400 });
    }

    let data;
    try {
      data = JSON.parse(body);
    } catch (parseError) {
      return new Response(JSON.stringify({ error: 'JSON inválido', body: body }), { status: 400 });
    }

    inicializar();

    // Obtener usuario autenticado del token
    let userId: number | null = null;
    let userName = data.vendedor || 'Mi Hacienda';
    const auth = request.headers.get('Authorization');
    if (auth && auth.startsWith('Bearer ')) {
      try {
        const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
        userId = payload.id || null;
        // Buscar el nombre real del usuario en la BD
        const user = db.prepare('SELECT id, nombre FROM usuarios WHERE id = ?').get(payload.id) as any;
        if (user) {
          userName = user.nombre;
        }
      } catch {}
    }

    const stmt = db.prepare(`
      INSERT INTO productos (
        nombre, categoria, raza, peso, peso_unitario, ubicacion, departamento,
        precio, precio_anterior, stock, vendedor_id, vendedor, vendedor_rating, imagenes,
        estado, salud, envio, destacado, oferta, trazabilidad, tipo_precio, descripcion, video, sexo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const imagenes = JSON.stringify(data.imagenes?.length ? data.imagenes : ['/images/ganado.svg']);
    
    stmt.run(
      data.nombre,
      data.categoria,
      data.raza || null,
      data.peso ? parseFloat(data.peso) : null,
      null,
      data.ubicacion,
      data.departamento,
      parseFloat(data.precio),
      null,
      parseInt(data.stock),
      userId,
      userName,
      4.5,
      imagenes,
      'disponible',
      data.salud || 'Bueno',
      1,
      0,
      0,
      0,
      data.tipoPrecio || 'fijo',
      (data.descripcion || '').slice(0, 100),
      data.video || '',
      data.sexo || ''
    );

    const lastId = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };

    return new Response(JSON.stringify({ success: true, id: lastId.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};