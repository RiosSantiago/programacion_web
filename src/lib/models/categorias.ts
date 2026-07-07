import { db } from '../db';

export interface Categoria {
  id: number;
  nombre: string;
  icono: string;
  color: string;
  cantidad: number;
}

export function getCategorias(): Categoria[] {
  return db.prepare('SELECT id, nombre, icono, color, cantidad FROM categorias ORDER BY cantidad DESC').all() as Categoria[];
}

export function getCategoriaById(id: number): Categoria | undefined {
  return db.prepare('SELECT * FROM categorias WHERE id = ?').get(id) as Categoria | undefined;
}

export function getCategoriaPorNombre(nombre: string): Categoria | undefined {
  return db.prepare('SELECT * FROM categorias WHERE LOWER(nombre) = LOWER(?)').get(nombre) as Categoria | undefined;
}

export function actualizarCantidadCategoria(categoria: string, delta: number) {
  db.prepare('UPDATE categorias SET cantidad = cantidad + ? WHERE LOWER(nombre) = LOWER(?)').run(delta, categoria);
}

export function actualizarStockProducto(productoId: number, cantidad: number) {
  db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?').run(cantidad, productoId);
}