const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000/api';

export interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  raza: string;
  peso: number;
  ubicacion: string;
  precio: number;
  stock: number;
  imagenes: string[];
  estado: string;
  vendedor: string;
  vendedorSlug: string;
  vendedorRating: number;
  trazabilidad: boolean;
  destacado: boolean;
  oferta: boolean;
  createdAt: string;
}

export interface Hacienda {
  slug: string;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  especies: string[];
  rating: number;
  ventas: number;
  miembroDesde: string;
  publicacionesActivas: number;
}

export async function getProductos(filters?: Record<string, string>): Promise<Producto[]> {
  const { getProductos: dbGetProductos } = await import('./models/productos.js');
  const rows = dbGetProductos();
  return rows.map((r: any) => ({
    id: r.id,
    nombre: r.nombre,
    categoria: r.categoria,
    raza: r.raza || '',
    peso: r.peso || 0,
    ubicacion: r.ubicacion,
    precio: r.precio,
    stock: r.stock,
    imagenes: r.imagenes ? JSON.parse(r.imagenes) : [],
    estado: r.estado || 'disponible',
    vendedor: r.vendedor,
    vendedorSlug: r.vendedor?.toLowerCase().replace(/\s+/g, '-') || '',
    vendedorRating: r.vendedor_rating || 4.5,
    trazabilidad: !!r.trazabilidad,
    destacado: !!r.destacado,
    oferta: !!r.oferta,
    createdAt: r.created_at || '',
  }));
}

export async function getProducto(slug: string): Promise<Producto | undefined> {
  const { getProductoById } = await import('./models/productos.js');
  const r = getProductoById(parseInt(slug));
  if (!r) return undefined;
  return {
    id: r.id,
    nombre: r.nombre,
    categoria: r.categoria,
    raza: r.raza || '',
    peso: r.peso || 0,
    ubicacion: r.ubicacion,
    precio: r.precio,
    stock: r.stock,
    imagenes: r.imagenes ? JSON.parse(r.imagenes) : [],
    estado: r.estado || 'disponible',
    vendedor: r.vendedor,
    vendedorSlug: r.vendedor?.toLowerCase().replace(/\s+/g, '-') || '',
    vendedorRating: r.vendedor_rating || 4.5,
    trazabilidad: !!r.trazabilidad,
    destacado: !!r.destacado,
    oferta: !!r.oferta,
    createdAt: r.created_at || '',
  };
}

export async function getHacienda(slug: string): Promise<Hacienda | undefined> {
  // Mock data - replace with API call
  return {
    slug,
    nombre: 'Hacienda Verde',
    descripcion: 'Hacienda familiar dedicada a la cría y engorde de ganado bovino.',
    ubicacion: 'Manizales, Caldas',
    especies: ['Bovinos', 'Porcinos'],
    rating: 4.8,
    ventas: 12,
    miembroDesde: 'marzo 2026',
    publicacionesActivas: 3,
  };
}
