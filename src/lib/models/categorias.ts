import { queryAll, queryGet, queryRun } from '../db';

export interface Categoria {
  id: number;
  nombre: string;
  icono: string;
  color: string;
  cantidad: number;
  slug: string;
}

export function generarSlug(nombre: string): string {
  return nombre.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function conSlug(row: any): Categoria {
  return {
    id: row.id,
    nombre: row.nombre,
    icono: row.icono,
    color: row.color,
    cantidad: row.cantidad ?? 0,
    slug: row.slug || generarSlug(row.nombre),
  };
}

export async function getCategorias(): Promise<Categoria[]> {
  const rows = await queryAll<any>('SELECT id, nombre, icono, color, cantidad, slug FROM categorias ORDER BY cantidad DESC');
  return rows.map(conSlug);
}

export async function getCategoriaById(id: number): Promise<Categoria | undefined> {
  const row = await queryGet<any>('SELECT * FROM categorias WHERE id = ?', [id]);
  return row ? conSlug(row) : undefined;
}

export async function getCategoriaPorNombre(nombre: string): Promise<Categoria | undefined> {
  const row = await queryGet<any>('SELECT * FROM categorias WHERE LOWER(nombre) = LOWER(?)', [nombre]);
  return row ? conSlug(row) : undefined;
}

export async function getCategoriaPorSlug(slug: string): Promise<Categoria | undefined> {
  const row = await queryGet<any>('SELECT * FROM categorias WHERE slug = ?', [slug]);
  if (row) return conSlug(row);
  const rows = await queryAll<any>('SELECT * FROM categorias');
  return rows.map(conSlug).find(c => c.slug === slug);
}

export async function actualizarCantidadCategoria(categoria: string, delta: number): Promise<void> {
  await queryRun('UPDATE categorias SET cantidad = cantidad + ? WHERE LOWER(nombre) = LOWER(?)', [delta, categoria]);
}

export async function actualizarStockProducto(productoId: number, cantidad: number): Promise<void> {
  await queryRun('UPDATE productos SET stock = stock - ? WHERE id = ?', [cantidad, productoId]);
}
