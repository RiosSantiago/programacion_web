import type { APIRoute } from 'astro';
import { queryGet, queryRun } from '../../lib/db';

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

    // C3: vendedor se resuelve desde usuarios.nombre via JWT (fuente canónica).
    // La columna productos.vendedor se escribe como snapshot en el INSERT por
    // compatibilidad con C4 diferida; las lecturas ya usan JOIN usuarios.
    let userId: number | null = null;
    let userName = data.vendedor || 'Mi Hacienda';
    const auth = request.headers.get('Authorization');
    if (auth && auth.startsWith('Bearer ')) {
      try {
        const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
        userId = payload.id || null;
        const user = await queryGet<any>('SELECT id, nombre FROM usuarios WHERE id = ?', [payload.id]);
        if (user) userName = user.nombre;
      } catch {}
    }

    const finca     = (data.finca || data.nombre_finca || '').trim();
    const vereda    = (data.vereda || '').trim();
    const referencia = (data.referencia_ubicacion || data.referencia || '').trim();

    if (!finca || finca.length < 3 || finca.length > 80) {
      return new Response(JSON.stringify({ error: 'El nombre de la finca es obligatorio y debe tener entre 3 y 80 caracteres.' }), { status: 400 });
    }
    if (vereda.length > 80) {
      return new Response(JSON.stringify({ error: 'La vereda no debe exceder 80 caracteres.' }), { status: 400 });
    }
    if (referencia.length > 200) {
      return new Response(JSON.stringify({ error: 'La referencia no debe exceder 200 caracteres.' }), { status: 400 });
    }

    const { lastInsertRowid: newId } = await queryRun(
      `INSERT INTO productos (
        nombre, categoria, raza, peso, peso_unitario, ubicacion, departamento,
        precio, precio_anterior, stock, vendedor_id, vendedor_rating,
        estado, salud, envio, destacado, oferta, trazabilidad, tipo_precio, descripcion, video, sexo,
        finca, vereda, referencia_ubicacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.nombre,
        data.categoria,
        data.raza || null,
        data.peso ? parseFloat(data.peso) : null,
        null,
        data.ubicacion,
        data.departamento || 'Caldas',
        parseFloat(data.precio),
        null,
        parseInt(data.stock),
        userId,
        4.5,
        'disponible',
        data.salud || 'Bueno',
        true,   // envio default true en publicación nueva
        false,
        false,
        false,
        data.tipoPrecio || 'fijo',
        (data.descripcion || '').slice(0, 500),
        data.video || '',
        data.sexo || null,
        finca,
        vereda,
        referencia.slice(0, 200),
      ]
    );

    const imgsToInsert = data.imagenes?.length ? data.imagenes : ['/images/ganado.svg'];
    for (let i = 0; i < imgsToInsert.length; i++) {
      await queryRun('INSERT INTO imagenes_producto (producto_id, url, orden) VALUES (?, ?, ?)', [newId, imgsToInsert[i], i]);
    }

    return new Response(JSON.stringify({ success: true, id: newId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en publicar:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};