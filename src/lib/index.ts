export { inicializar } from './db';
export { getCategorias, getCategoriaById, getCategoriaPorNombre } from './models/categorias';
export { getProductos, getProductosDestacados, getProductoById, filtrarProductos, getTotalProductos } from './models/productos';
export { getInventario, getEstadisticas, getIndicadoresCrecimiento, getAnimalById, getAnimalPorCodigo } from './models/inventario';

export type { Categoria } from './models/categorias';
export type { Producto } from './models/productos';
export type { Animal, EstadisticasDashboard, IndicadorCrecimiento } from './models/inventario';