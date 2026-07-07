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
  const params = new URLSearchParams(filters).toString();
  const url = `${API_BASE}/marketplace/listings${params ? '?' + params : ''}`;
  
  // For now, return mock data from local file
  const { productos } = await import('../data/productos.js');
  return productos;
}

export async function getProducto(slug: string): Promise<Producto | undefined> {
  const { productos } = await import('../data/productos.js');
  return productos.find((p: Producto) => p.id.toString() === slug);
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
