export { inicializar, inicializarTablas } from './db';
export { db } from './db';
export { getCategorias, getCategoriaById, getCategoriaPorNombre } from './models/categorias';
export { getProductos, getProductosDestacados, getProductoById, filtrarProductos, getTotalProductos, crearProducto } from './models/productos';
export type { CrearProductoInput } from './models/productos';
export { getInventario, getEstadisticas, getIndicadoresCrecimiento, getAnimalById, getAnimalPorCodigo } from './models/inventario';

export type { Categoria } from './models/categorias';
export type { Producto } from './models/productos';
export type { Animal, EstadisticasDashboard, IndicadorCrecimiento } from './models/inventario';