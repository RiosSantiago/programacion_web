import type { APIRoute } from 'astro';
import { queryAll, queryGet, queryRun } from '../../lib/db';

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

    const sexo = ((data.sexo || '').trim().toLowerCase()) || null;

    const finca     = (data.finca || data.nombre_finca || '').trim();
    const vereda    = (data.vereda || '').trim();
    const referencia = (data.referencia_ubicacion || data.referencia || '').trim();

    const catSlug = (data.categoria || '').toLowerCase();
    const catSlugMap: Record<string, number> = {};
    const cats = await queryAll<{ id: number; slug: string }>('SELECT id, slug FROM categorias');
    for (const c of cats) catSlugMap[c.slug] = c.id;
    const categoriaId = catSlugMap[catSlug] || catSlugMap[catSlug.replace(/s$/, '')] || null;
    const esAgricola = ['agricultura', 'cultivos'].includes(catSlug.replace(/s$/, ''));

    let categoriaCol = 'bovino';
    if (categoriaId) {
      const cat = await queryGet<{ slug: string }>('SELECT slug FROM categorias WHERE id = ?', [categoriaId]);
      if (cat) categoriaCol = cat.slug;
    } else {
      categoriaCol = (catSlug.replace(/s$/, '') || 'bovino');
    }

    if (!data.nombre || !data.nombre.trim()) {
      return new Response(JSON.stringify({ error: 'El nombre es obligatorio.' }), { status: 400 });
    }
    if (!catSlug) {
      return new Response(JSON.stringify({ error: 'La categoría es obligatoria.' }), { status: 400 });
    }
    if (!data.ubicacion || !data.ubicacion.trim()) {
      return new Response(JSON.stringify({ error: 'El municipio es obligatorio.' }), { status: 400 });
    }

    // Validaciones específicas de Pecuario
    if (!esAgricola) {
      if (!sexo) {
        return new Response(JSON.stringify({ error: 'El sexo es obligatorio.' }), { status: 400 });
      }
      if (!data.stock || isNaN(parseInt(data.stock)) || parseInt(data.stock) <= 0) {
        return new Response(JSON.stringify({ error: 'La cantidad (stock) es obligatoria y debe ser un número mayor a 0.' }), { status: 400 });
      }
      if (!finca || finca.length < 3 || finca.length > 80) {
        return new Response(JSON.stringify({ error: 'El nombre de la finca es obligatorio y debe tener entre 3 y 80 caracteres.' }), { status: 400 });
      }
      if (!data.precio || isNaN(parseFloat(data.precio)) || parseFloat(data.precio) <= 0) {
        return new Response(JSON.stringify({ error: 'El precio total es obligatorio y debe ser un número positivo.' }), { status: 400 });
      }
      if (!data.raza || !data.raza.trim()) {
        return new Response(JSON.stringify({ error: 'La raza es obligatoria.' }), { status: 400 });
      }
      if (!data.tipoPrecio || !['fijo', 'negociable'].includes(data.tipoPrecio)) {
        return new Response(JSON.stringify({ error: 'El tipo de precio es obligatorio.' }), { status: 400 });
      }
      if (!data.salud || !data.salud.trim()) {
        return new Response(JSON.stringify({ error: 'El estado de salud es obligatorio.' }), { status: 400 });
      }
    }

    // Validaciones comunes (Pecuario + Agrícola)
    if (data.peso === undefined || data.peso === null || String(data.peso).trim() === '' || isNaN(parseFloat(data.peso)) || parseFloat(data.peso) <= 0) {
      return new Response(JSON.stringify({ error: 'El peso es obligatorio y debe ser un número mayor a 0.' }), { status: 400 });
    }
    if (!data.transporte || !['agroup', 'propio'].includes(data.transporte)) {
      return new Response(JSON.stringify({ error: 'El método de transporte es obligatorio.' }), { status: 400 });
    }
    if (!data.descripcion || !data.descripcion.trim()) {
      return new Response(JSON.stringify({ error: 'La descripción es obligatoria.' }), { status: 400 });
    }
    if (!data.imagenes || !Array.isArray(data.imagenes) || data.imagenes.length === 0 || 
        (data.imagenes.length === 1 && (data.imagenes[0] === '/images/categories/bovinos.webp' || data.imagenes[0] === '/images/categories/cultivos.webp'))) {
      return new Response(JSON.stringify({ error: 'Debes incluir al menos una foto del producto.' }), { status: 400 });
    }

    if (vereda.length > 80) {
      return new Response(JSON.stringify({ error: 'La vereda no debe exceder 80 caracteres.' }), { status: 400 });
    }
    if (referencia.length > 200) {
      return new Response(JSON.stringify({ error: 'La referencia no debe exceder 200 caracteres.' }), { status: 400 });
    }

    const precioTotal = parseFloat(data.precio);
    const stockQty = parseInt(data.stock) || 1;
    const precioUnitario = data.precio_unitario !== undefined && data.precio_unitario !== null && !isNaN(parseFloat(data.precio_unitario))
      ? parseFloat(data.precio_unitario)
      : (stockQty > 0 ? parseFloat((precioTotal / stockQty).toFixed(2)) : precioTotal);

    const { lastInsertRowid: newId } = await queryRun(
      `INSERT INTO productos (
        nombre, categoria, categoria_id, raza, peso, peso_unitario, ubicacion, departamento,
        precio, precio_unitario, precio_anterior, stock, vendedor_id, vendedor_rating,
        estado, salud, envio, destacado, oferta, trazabilidad, tipo_precio, descripcion, video, sexo,
        finca, vereda, referencia_ubicacion, ica_pdf, transporte
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.nombre,
        categoriaCol,
        categoriaId,
        data.raza || null,
        data.peso ? parseFloat(data.peso) : null,
        null,
        data.ubicacion,
        data.departamento || 'Caldas',
        precioTotal,
        precioUnitario,
        null,
        stockQty,
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
        sexo,
        finca,
        vereda,
        referencia.slice(0, 200),
        data.certificaciones ? JSON.stringify(data.certificaciones) : '',
        data.transporte === 'agroup' ? 'agroup' : 'propio',
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