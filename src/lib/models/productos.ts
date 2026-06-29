import { db } from '../db';

export interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  raza: string | null;
  peso: number | null;
  peso_unitario: number | null;
  ubicacion: string;
  departamento: string;
  precio: number;
  precio_anterior: number | null;
  stock: number;
  vendedor: string;
  vendedor_rating: number | null;
  imagenes: string;
  estado: string | null;
  salud: string | null;
  envio: number;
  destacado: number;
  oferta: number;
  trazabilidad: number;
  tipo_precio: string;
  sexo: string;
  fecha_nacimiento: string;
  created_at: string;
  video: string;
}

function getPlaceholderImagen(categoria: string): string {
  const imagenesCategoria: Record<string, string> = {
    bovino: '/images/ganado.svg',
    equino: '/images/caballo.svg',
    porcino: '/images/cerdo.svg',
    avicola: '/images/gallina.svg',
    cultivos: '/images/cultivos.svg',
    servicios: '/images/default.svg',
  };
  return imagenesCategoria[categoria] || '/images/default.svg';
}

function transformarProducto(row: any): any {
  try {
    const imagenes = row.imagenes ? JSON.parse(row.imagenes) : [];
    const categoria = row.categoria || 'bovino';
    return {
      ...row,
      destacado: row.destacado === 1,
      oferta: row.oferta === 1,
      trazabilidad: row.trazabilidad === 1,
      envio: row.envio === 1,
      imagenes,
      imagen: imagenes[0] || getPlaceholderImagen(categoria),
      video: row.video || '',
    };
  } catch {
    return {
      ...row,
      destacado: false,
      oferta: false,
      trazabilidad: false,
      envio: false,
      imagenes: [],
      imagen: getPlaceholderImagen(row.categoria || 'bovino'),
      video: '',
    };
  }
}

export function getProductos(): Producto[] {
  const rows = db.prepare('SELECT * FROM productos ORDER BY id DESC').all() as Producto[];
  return rows.map(transformarProducto);
}

export function getProductosDestacados(limit: number = 6): Producto[] {
  const rows = db.prepare('SELECT * FROM productos WHERE destacado = 1 ORDER BY id DESC LIMIT ?').all(limit) as Producto[];
  return rows.map(transformarProducto);
}

export function getProductoById(id: number): Producto | undefined {
  const row = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
  if (!row) return undefined;
  return transformarProducto(row);
}

export function filtrarProductos(options: {
  categoria?: string;
  municipio?: string;
  departamento?: string;
  precioMin?: number;
  precioMax?: number;
  busqueda?: string;
  raza?: string;
  sexo?: string;
  edad?: string;
  tipoPrecio?: string;
  trazabilidad?: string;
  destacados?: string;
  fechaPublicacion?: string;
  sortBy?: string;
}): Producto[] {
  let query = 'SELECT * FROM productos WHERE 1=1';
  const params: any[] = [];

  if (options.categoria && options.categoria !== 'todos') {
    const cats = options.categoria.split(',').map(s => s.trim()).filter(Boolean);
    if (cats.length > 0) {
      query += ` AND categoria IN (${cats.map(() => '?').join(',')})`;
      params.push(...cats);
    }
  }

  if (options.municipio) {
    const muns = options.municipio.split(',').map(s => s.trim()).filter(Boolean);
    if (muns.length > 0) {
      const likeClauses = muns.map(() => 'ubicacion LIKE ?');
      query += ` AND (${likeClauses.join(' OR ')})`;
      muns.forEach(m => params.push(`%${m}%`));
    }
  }

  if (options.departamento) {
    query += ' AND departamento LIKE ?';
    params.push(`%${options.departamento}%`);
  }

  if (options.precioMin) {
    query += ' AND precio >= ?';
    params.push(options.precioMin);
  }

  if (options.precioMax) {
    query += ' AND precio <= ?';
    params.push(options.precioMax);
  }

  if (options.raza) {
    query += ' AND raza LIKE ?';
    params.push(`%${options.raza}%`);
  }

  if (options.sexo) {
    const sexos = options.sexo.split(',').map(s => s.trim()).filter(Boolean);
    if (sexos.length > 0) {
      query += ` AND sexo IN (${sexos.map(() => '?').join(',')})`;
      params.push(...sexos);
    }
  }

  if (options.tipoPrecio) {
    const tipos = options.tipoPrecio.split(',').map(s => s.trim()).filter(Boolean);
    if (tipos.length > 0) {
      query += ` AND tipo_precio IN (${tipos.map(() => '?').join(',')})`;
      params.push(...tipos);
    }
  }

  if (options.trazabilidad === 'true') {
    query += ' AND trazabilidad = 1';
  }

  if (options.destacados === 'true') {
    query += ' AND destacado = 1';
  }

  if (options.fechaPublicacion) {
    const fechas = options.fechaPublicacion.split(',').map(s => s.trim()).filter(Boolean);
    if (fechas.length > 0) {
      const now = new Date();
      const dateClauses: string[] = [];
      for (const f of fechas) {
        let dateFrom: Date | null = null;
        switch (f) {
          case 'hoy':
            dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'semana':
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'mes':
            dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        }
        if (dateFrom) {
          dateClauses.push('created_at >= ?');
          params.push(dateFrom.toISOString());
        }
      }
      if (dateClauses.length > 0) {
        query += ` AND (${dateClauses.join(' OR ')})`;
      }
    }
  }

  if (options.busqueda) {
    query += ' AND (nombre LIKE ? OR raza LIKE ? OR vendedor LIKE ? OR ubicacion LIKE ?)';
    const searchTerm = `%${options.busqueda}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  switch (options.sortBy) {
    case 'precio-asc':
      query += ' ORDER BY precio ASC';
      break;
    case 'precio-desc':
      query += ' ORDER BY precio DESC';
      break;
    case 'recientes':
      query += ' ORDER BY created_at DESC';
      break;
    default:
      query += ' ORDER BY id DESC';
  }

  const rows = db.prepare(query).all(...params) as Producto[];
  return rows.map(transformarProducto);
}

export function getTotalProductos(): number {
  const result = db.prepare('SELECT COUNT(*) as count FROM productos').get() as { count: number };
  return result.count;
}

export interface CrearProductoInput {
  nombre: string;
  categoria: string;
  raza?: string;
  peso?: number;
  pesoUnitario?: number;
  ubicacion: string;
  departamento: string;
  precio: number;
  precioAnterior?: number;
  stock: number;
  vendedor: string;
  vendedorRating?: number;
  imagenes?: string[];
  estado?: string;
  salud?: string;
  envio?: boolean;
  destacado?: boolean;
  oferta?: boolean;
  trazabilidad?: boolean;
}

export function crearProducto(data: CrearProductoInput): number {
  const placeholderImg = data.imagenes?.[0] || getPlaceholderImagen(data.categoria);
  
  const stmt = db.prepare(`
    INSERT INTO productos (
      nombre, categoria, raza, peso, peso_unitario, ubicacion, departamento,
      precio, precio_anterior, stock, vendedor, vendedor_rating, imagenes,
      estado, salud, envio, destacado, oferta, trazabilidad
    ) VALUES (
      @nombre, @categoria, @raza, @peso, @peso_unitario, @ubicacion, @departamento,
      @precio, @precio_anterior, @stock, @vendedor, @vendedor_rating, @imagenes,
      @estado, @salud, @envio, @destacado, @oferta, @trazabilidad
    )
  `);

  const result = stmt.run({
    nombre: data.nombre,
    categoria: data.categoria,
    raza: data.raza || null,
    peso: data.peso || null,
    peso_unitario: data.pesoUnitario || null,
    ubicacion: data.ubicacion,
    departamento: data.departamento,
    precio: data.precio,
    precio_anterior: data.precioAnterior || null,
    stock: data.stock,
    vendedor: data.vendedor,
    vendedor_rating: data.vendedorRating || 4.5,
    imagenes: JSON.stringify([placeholderImg]),
    estado: data.estado || 'disponible',
    salud: data.salud || 'Bueno',
    envio: data.envio ? 1 : 0,
    destacado: data.destacado ? 1 : 0,
    oferta: data.oferta ? 1 : 0,
    trazabilidad: data.trazabilidad ? 1 : 0,
  });

  return result.lastInsertRowid as number;
}

export function getProductosByVendedorId(vendedorId: number): Producto[] {
  const rows = db.prepare('SELECT * FROM productos WHERE vendedor_id = ? ORDER BY id DESC').all(vendedorId) as Producto[];
  return rows.map(transformarProducto);
}

export function actualizarProducto(id: number, data: Partial<Producto>): boolean {
  const fields: string[] = [];
  const params: any[] = [];

  const allowedFields = ['nombre', 'categoria', 'raza', 'peso', 'ubicacion', 'departamento', 'precio', 'stock', 'salud', 'estado', 'tipo_precio', 'sexo', 'fecha_nacimiento', 'video'];
  for (const field of allowedFields) {
    if (data[field as keyof Producto] !== undefined) {
      fields.push(`${field} = ?`);
      params.push(data[field as keyof Producto]);
    }
  }

  if (data.imagenes !== undefined) {
    fields.push('imagenes = ?');
    params.push(JSON.stringify(data.imagenes));
  }

  if (fields.length === 0) return false;

  params.push(id);
  const result = db.prepare(`UPDATE productos SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return result.changes > 0;
}

export function eliminarProducto(id: number): boolean {
  const result = db.prepare('DELETE FROM productos WHERE id = ?').run(id);
  return result.changes > 0;
}