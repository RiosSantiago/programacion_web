import { pool } from './src/lib/db.ts';

async function spotCheck() {
  const prods = (await pool.query<{ id: number; nombre: string; imagenes: string }>('SELECT id, nombre, imagenes FROM productos ORDER BY id ASC')).rows;
  
  // Buscar producto con más de 1 imagen
  const multi = prods.find(p => {
    try {
      const arr = JSON.parse(p.imagenes);
      return Array.isArray(arr) && arr.length > 1;
    } catch {
      return false;
    }
  }) || prods[0]; // fallback al primero

  const imgs = (await pool.query<{ id: number; producto_id: number; url: string; orden: number }>(
    'SELECT id, producto_id, url, orden FROM imagenes_producto WHERE producto_id = $1 ORDER BY orden ASC',
    [multi.id]
  )).rows;

  console.log('=== SPOT-CHECK PRODUCTO CON MÚLTIPLES IMÁGENES ===\n');
  console.log(`ID Producto: ${multi.id}`);
  console.log(`Nombre: "${multi.nombre}"`);
  console.log(`JSON Original (productos.imagenes):\n${multi.imagenes}\n`);
  console.log(`Filas en tabla imagenes_producto (ORDER BY orden ASC):`);
  console.table(imgs);

  process.exit(0);
}

spotCheck().catch(err => {
  console.error(err);
  process.exit(1);
});
