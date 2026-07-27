import { queryAll, queryGet, queryRun } from '../db';

export interface Categoria {
  id: number;
  nombre: string;
  icono: string;
  color: string;
  cantidad: number;
}

export async function getCategorias(): Promise<Categoria[]> {
  return queryAll<Categoria>('SELECT id, nombre, icono, color, cantidad FROM categorias ORDER BY cantidad DESC');
}

export async function getCategoriaById(id: number): Promise<Categoria | undefined> {
  return queryGet<Categoria>('SELECT * FROM categorias WHERE id = ?', [id]);
}

export async function getCategoriaPorNombre(nombre: string): Promise<Categoria | undefined> {
  return queryGet<Categoria>('SELECT * FROM categorias WHERE LOWER(nombre) = LOWER(?)', [nombre]);
}

export async function actualizarCantidadCategoria(categoria: string, delta: number): Promise<void> {
  await queryRun('UPDATE categorias SET cantidad = cantidad + ? WHERE LOWER(nombre) = LOWER(?)', [delta, categoria]);
}

export async function actualizarStockProducto(productoId: number, cantidad: number): Promise<void> {
  await queryRun('UPDATE productos SET stock = stock - ? WHERE id = ?', [cantidad, productoId]);
}