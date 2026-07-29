import { queryAll, queryGet, queryRun } from '../db';

export interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  categoria_id?: number | null;
  raza?: string | null;
  peso?: number | null;
  peso_unitario?: number | null;
  ubicacion: string;
  departamento: string;
  precio: number;
  precio_anterior?: number | null;
  precioAnterior?: number | null;
  stock: number;
  vendedor: string;
  vendedor_id?: number | null;
  vendedor_rating?: number | null;
  vendedorRating?: number | null;
  imagenes?: any;
  imagen?: string;
  estado?: string | null;
  salud?: string | null;
  envio?: boolean;
  destacado?: boolean;
  oferta?: boolean;
  trazabilidad?: boolean;
  tipo_precio?: string;
  sexo?: string;
  fecha_nacimiento?: string;
  descripcion?: string;
  created_at?: string;
  video?: string;
  finca?: string;
  vereda?: string;
  referencia_ubicacion?: string;
  certificaciones?: string[];
}

function getPlaceholderImagen(categoria: string): string {
  const imagenesCategoria: Record<string, string> = {
    bovino:    '/images/ganado.svg',
    equino:    '/images/caballo.svg',
    porcino:   '/images/cerdo.svg',
    ovino:     '/images/ganado.svg',
    avicola:   '/images/gallina.svg',
    cultivos:  '/images/cultivos.svg',
    servicios: '/images/default.svg',
    agricultura: '/images/cultivos.svg',
    insumos:    '/images/default.svg',
  };
  return imagenesCategoria[categoria] || '/images/default.svg';
}

export async function getImagenesMap(productoIds: number[]): Promise<Record<number, string[]>> {
  if (!productoIds || productoIds.length === 0) return {};
  const rows = await queryAll<{ producto_id: number; url: string }>(
    `SELECT producto_id, url FROM imagenes_producto WHERE producto_id IN (${productoIds.map(() => '?').join(',')}) ORDER BY orden ASC`,
    productoIds
  );
  const map: Record<number, string[]> = {};
  for (const r of rows) {
    if (!map[r.producto_id]) map[r.producto_id] = [];
    map[r.producto_id].push(r.url);
  }
  return map;
}

export async function getImagenesByProductoId(productoId: number): Promise<string[]> {
  const rows = await queryAll<{ url: string }>(
    'SELECT url FROM imagenes_producto WHERE producto_id = ? ORDER BY orden ASC',
    [productoId]
  );
  return rows.map(r => r.url);
}

function transformarProducto(row: any, imagenesTabulares?: string[]): Producto {
  try {
    const imagenes: string[] = (imagenesTabulares && imagenesTabulares.length > 0) ? imagenesTabulares : [];
    const categoria = row.categoria || 'bovino';
    const { ica_pdf, ...rest } = row;
    return {
      ...rest,
      destacado:    Boolean(row.destacado),
      oferta:       Boolean(row.oferta),
      trazabilidad: Boolean(row.trazabilidad),
      envio:        Boolean(row.envio),
      imagenes,
      imagen: imagenes[0] || getPlaceholderImagen(categoria),
      video: row.video || '',
      precioAnterior:  row.precio_anterior ?? row.precioAnterior ?? null,
      vendedorRating:  row.vendedor_rating  ?? row.vendedorRating  ?? 4.5,
      vendedor_id:     row.vendedor_id      ?? null,
      certificaciones: parseCertificaciones(ica_pdf),
    };
  } catch {
    return {
      ...row,
      destacado: false, oferta: false, trazabilidad: false, envio: false,
      imagenes: [],
      imagen: getPlaceholderImagen(row.categoria || 'bovino'),
      video: '',
      precioAnterior: row.precio_anterior ?? null,
      vendedorRating: row.vendedor_rating  ?? 4.5,
      vendedor_id:    row.vendedor_id       ?? null,
      certificaciones: [],
    };
  }
}

function parseCertificaciones(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(String(val));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function attachImagenes(rows: any[]): Promise<Producto[]> {
  if (!rows || rows.length === 0) return [];
  const ids = rows.map(r => r.id);
  const imgMap = await getImagenesMap(ids);
  return rows.map(r => transformarProducto(r, imgMap[r.id]));
}

// ---------------------------------------------------------------------------
// SLUG → ID map (dinámico desde DB)
// ---------------------------------------------------------------------------
let _slugMap: Record<string, number> | null = null;

async function getMapSlugToId(): Promise<Record<string, number>> {
  if (_slugMap) return _slugMap;
  const rows = await queryAll<{ slug: string; id: number }>('SELECT slug, id FROM categorias');
  _slugMap = {};
  for (const r of rows) {
    _slugMap[r.slug] = r.id;
    _slugMap[r.slug.replace(/-/g, '')] = r.id;
  }
  return _slugMap;
}

// ---------------------------------------------------------------------------
// LECTURAS
// ---------------------------------------------------------------------------
export async function getProductos(): Promise<Producto[]> {
  // C3: vendedor proviene exclusivamente de usuarios.nombre via JOIN
  const rows = await queryAll(
    `SELECT p.*, u.nombre AS vendedor
     FROM productos p
     LEFT JOIN usuarios u ON p.vendedor_id = u.id
     ORDER BY p.id DESC`
  );
  return attachImagenes(rows);
}



export async function getProductosDestacados(limit: number = 6): Promise<Producto[]> {
  // C3: vendedor proviene exclusivamente de usuarios.nombre via JOIN
  const rows = await queryAll(
    `SELECT p.*, u.nombre AS vendedor
     FROM productos p
     LEFT JOIN usuarios u ON p.vendedor_id = u.id
     WHERE p.destacado = true
     ORDER BY p.id DESC
     LIMIT ?`,
    [limit]
  );
  return attachImagenes(rows);
}



export async function getProductoById(id: number): Promise<Producto | undefined> {
  // C3: vendedor proviene exclusivamente de usuarios.nombre via JOIN
  const row = await queryGet(
    `SELECT p.*, u.nombre AS vendedor
     FROM productos p
     LEFT JOIN usuarios u ON p.vendedor_id = u.id
     WHERE p.id = ?`,
    [id]
  );
  if (!row) return undefined;
  const imgs = await getImagenesByProductoId(id);
  return transformarProducto(row, imgs);
}



export async function getTotalProductos(): Promise<number> {
  const result = await queryGet<{ count: string }>('SELECT COUNT(*) as count FROM productos');
  return Number(result?.count ?? 0);
}

export async function getProductosByVendedorId(vendedorId: number): Promise<Producto[]> {
  // C3: vendedor proviene exclusivamente de usuarios.nombre via JOIN
  const rows = await queryAll(
    `SELECT p.*, u.nombre AS vendedor
     FROM productos p
     LEFT JOIN usuarios u ON p.vendedor_id = u.id
     WHERE p.vendedor_id = ?
     ORDER BY p.id DESC`,
    [vendedorId]
  );
  return attachImagenes(rows);
}



// ---------------------------------------------------------------------------
// FILTRADO
// ---------------------------------------------------------------------------
export async function filtrarProductos(options: {
  categoria?:        string;
  municipio?:        string;
  departamento?:     string;
  precioMin?:        number;
  precioMax?:        number;
  busqueda?:         string;
  raza?:             string;
  sexo?:             string;
  edad?:             string;
  tipoPrecio?:       string;
  trazabilidad?:     string;
  destacados?:       string;
  fechaPublicacion?: string;
  sortBy?:           string;
}): Promise<Producto[]> {
  // C3: filtrarProductos usa JOIN con usuarios para obtener el nombre del vendedor.
  // La query se construye dinámicamente; aplicamos el JOIN en la base y prefijamos
  // todas las columnas de productos con alias para evitar ambigüedad.
  let baseQuery = `
    SELECT p.*, u.nombre AS vendedor
    FROM productos p
    LEFT JOIN usuarios u ON p.vendedor_id = u.id
    WHERE 1=1
  `;
  let query = baseQuery;
  const params: any[] = [];

  if (options.categoria && options.categoria !== 'todos') {
    const cats = options.categoria.split(',').map(s => s.trim()).filter(Boolean);
    if (cats.length > 0) {
      const slugMap = await getMapSlugToId();
      const numericIds: number[] = [];
      cats.forEach(c => {
        const num = Number(c);
        if (!isNaN(num)) numericIds.push(num);
        const mapped = slugMap[c.toLowerCase()];
        if (mapped && !numericIds.includes(mapped)) numericIds.push(mapped);
      });
      if (numericIds.length > 0) {
        query += ` AND (p.categoria_id IN (${numericIds.map(() => '?').join(',')}) OR p.categoria IN (${cats.map(() => '?').join(',')}))`;
        params.push(...numericIds, ...cats);
      } else {
        query += ` AND p.categoria IN (${cats.map(() => '?').join(',')})`;
        params.push(...cats);
      }
    }
  }

  if (options.municipio) {
    const muns = options.municipio.split(',').map(s => s.trim().replace(/\s*\(capital\)/i, '')).filter(Boolean);
    if (muns.length > 0) {
      query += ` AND (${muns.map(() => 'p.ubicacion ILIKE ?').join(' OR ')})`;
      muns.forEach(m => params.push(`%${m}%`));
    }
  }

  if (options.departamento) {
    query += ' AND p.departamento ILIKE ?';
    params.push(`%${options.departamento}%`);
  }

  if (options.precioMin) { query += ' AND p.precio >= ?'; params.push(options.precioMin); }
  if (options.precioMax) { query += ' AND p.precio <= ?'; params.push(options.precioMax); }

  if (options.raza) {
    query += ' AND p.raza ILIKE ?';
    params.push(`%${options.raza}%`);
  }

  if (options.sexo) {
    const sexos = options.sexo.split(',').map(s => s.trim()).filter(Boolean);
    if (sexos.length > 0) {
      query += ` AND p.sexo IN (${sexos.map(() => '?').join(',')})`;
      params.push(...sexos);
    }
  }

  if (options.tipoPrecio) {
    const tipos = options.tipoPrecio.split(',').map(s => s.trim()).filter(Boolean);
    if (tipos.length > 0) {
      query += ` AND p.tipo_precio IN (${tipos.map(() => '?').join(',')})`;
      params.push(...tipos);
    }
  }

  if (options.trazabilidad === 'true') { query += ' AND p.trazabilidad = true'; }
  if (options.destacados   === 'true') { query += ' AND p.destacado = true'; }

  if (options.fechaPublicacion) {
    const fechas = options.fechaPublicacion.split(',').map(s => s.trim()).filter(Boolean);
    if (fechas.length > 0) {
      const now = new Date();
      const dateClauses: string[] = [];
      for (const f of fechas) {
        let dateFrom: Date | null = null;
        if      (f === 'hoy')    dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        else if (f === 'semana') dateFrom = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
        else if (f === 'mes')    dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (dateFrom) { dateClauses.push('p.created_at >= ?'); params.push(dateFrom.toISOString()); }
      }
      if (dateClauses.length > 0) query += ` AND (${dateClauses.join(' OR ')})`;
    }
  }

  if (options.busqueda) {
    const searchTerm = `%${options.busqueda.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}%`;
    // C3: búsqueda en u.nombre (JOIN) — sin referencia a la columna p.vendedor
    query += ` AND (
      p.nombre ILIKE ? OR
      COALESCE(p.raza, '') ILIKE ? OR
      u.nombre ILIKE ? OR
      p.ubicacion ILIKE ? OR
      p.categoria ILIKE ? OR
      COALESCE(p.descripcion, '') ILIKE ?
    )`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  switch (options.sortBy) {
    case 'precio-asc':  query += ' ORDER BY p.precio ASC';       break;
    case 'precio-desc': query += ' ORDER BY p.precio DESC';      break;
    case 'recientes':   query += ' ORDER BY p.created_at DESC';  break;
    default:            query += ' ORDER BY p.id DESC';
  }

  const rows = await queryAll(query, params);
  return attachImagenes(rows);
}


// ---------------------------------------------------------------------------
// ESCRITURA
// ---------------------------------------------------------------------------
export interface CrearProductoInput {
  nombre:       string;
  categoria:    string;
  categoria_id?: number;
  raza?:        string;
  peso?:        number;
  pesoUnitario?: number;
  ubicacion:    string;
  departamento: string;
  precio:       number;
  precioAnterior?: number;
  stock:        number;
  vendedor:     string;
  vendedorRating?: number;
  vendedor_id?: number | null;
  imagenes?:    string[];
  estado?:      string;
  salud?:       string;
  envio?:       boolean;
  destacado?:   boolean;
  oferta?:      boolean;
  trazabilidad?: boolean;
  tipo_precio?: string;
  sexo?:        string;
  fecha_nacimiento?: string;
  descripcion?: string;
  video?:       string;
  finca?:       string;
  vereda?:      string;
  referencia_ubicacion?: string;
  certificaciones?: string[];
}

export async function crearProducto(data: CrearProductoInput): Promise<number> {
  const placeholderImg = data.imagenes?.[0] || getPlaceholderImagen(data.categoria);
  const slugMap = await getMapSlugToId();
  const catId = data.categoria_id || slugMap[data.categoria?.toLowerCase()] || null;

  const { lastInsertRowid } = await queryRun(
    `INSERT INTO productos (
      nombre, categoria, categoria_id, raza, peso, peso_unitario, ubicacion, departamento,
      precio, precio_anterior, stock, vendedor_id, vendedor_rating,
      estado, salud, envio, destacado, oferta, trazabilidad, tipo_precio,
      sexo, fecha_nacimiento, descripcion, video, finca, vereda, referencia_ubicacion, ica_pdf
    ) VALUES (
      @nombre, @categoria, @categoria_id, @raza, @peso, @peso_unitario, @ubicacion, @departamento,
      @precio, @precio_anterior, @stock, @vendedor_id, @vendedor_rating,
      @estado, @salud, @envio, @destacado, @oferta, @trazabilidad, @tipo_precio,
      @sexo, @fecha_nacimiento, @descripcion, @video, @finca, @vereda, @referencia_ubicacion, @certificaciones
    )`,
    {
      nombre: data.nombre,
      categoria: data.categoria,
      categoria_id: catId,
      raza: data.raza || null,
      peso: data.peso || null,
      peso_unitario: data.pesoUnitario || null,
      ubicacion: data.ubicacion,
      departamento: data.departamento,
      precio: data.precio,
      precio_anterior: data.precioAnterior || null,
      stock: data.stock,
      vendedor_id: data.vendedor_id ?? null,
      vendedor_rating: data.vendedorRating || 4.5,
      estado: data.estado || 'disponible',
      salud: data.salud || 'Bueno',
      envio: data.envio ?? false,
      destacado: data.destacado ?? false,
      oferta: data.oferta ?? false,
      trazabilidad: data.trazabilidad ?? false,
      tipo_precio: data.tipo_precio || 'fijo',
      sexo: data.sexo || null,
      fecha_nacimiento: data.fecha_nacimiento || '',
      descripcion: data.descripcion || '',
      video: data.video || '',
      finca: data.finca || '',
      vereda: data.vereda || '',
      referencia_ubicacion: data.referencia_ubicacion || '',
      certificaciones: data.certificaciones ? JSON.stringify(data.certificaciones) : '',
    }
  );

  const imgsToSave = data.imagenes?.length ? data.imagenes : [placeholderImg];
  for (let i = 0; i < imgsToSave.length; i++) {
    await queryRun('INSERT INTO imagenes_producto (producto_id, url, orden) VALUES (?, ?, ?)', [lastInsertRowid, imgsToSave[i], i]);
  }

  return lastInsertRowid;
}

export async function actualizarProducto(id: number, data: Partial<Producto>): Promise<boolean> {
  const fields: string[] = [];
  const params: any[]    = [];

  if (data.categoria !== undefined && data.categoria_id === undefined) {
    const slugMap = await getMapSlugToId();
    data.categoria_id = slugMap[data.categoria?.toLowerCase()] || null;
  }

  const allowedFields = [
    'nombre', 'categoria', 'categoria_id', 'raza', 'peso', 'ubicacion',
    'departamento', 'precio', 'stock', 'salud', 'estado', 'tipo_precio',
    'sexo', 'fecha_nacimiento', 'video', 'finca', 'vereda', 'referencia_ubicacion', 'certificaciones',
  ];

  for (const field of allowedFields) {
    if (data[field as keyof Producto] !== undefined) {
      fields.push(`${field} = ?`);
      const val = data[field as keyof Producto];
      params.push(field === 'certificaciones' ? JSON.stringify(val) : val);
    }
  }
  if (data.imagenes !== undefined && Array.isArray(data.imagenes)) {
    await queryRun('DELETE FROM imagenes_producto WHERE producto_id = ?', [id]);
    for (let i = 0; i < data.imagenes.length; i++) {
      await queryRun('INSERT INTO imagenes_producto (producto_id, url, orden) VALUES (?, ?, ?)', [id, data.imagenes[i], i]);
    }
  }
  if (fields.length === 0 && !Array.isArray(data.imagenes)) return false;

  params.push(id);
  const result = await queryRun(`UPDATE productos SET ${fields.join(', ')} WHERE id = ?`, params);
  return result.changes > 0;
}

export async function eliminarProducto(id: number): Promise<boolean> {
  const result = await queryRun('DELETE FROM productos WHERE id = ?', [id]);
  return result.changes > 0;
}