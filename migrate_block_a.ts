import { pool } from './src/lib/db.ts';

async function runBlockA() {
  console.log('=== BLOQUE A: CREACIÓN Y MIGRACIÓN DE TABLA imagenes_producto ===\n');

  // 1. Crear la tabla imagenes_producto
  console.log('1. Creando tabla imagenes_producto...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS imagenes_producto (
        id SERIAL PRIMARY KEY,
        producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        orden INTEGER DEFAULT 0
    );
  `);
  console.log('✅ Tabla imagenes_producto creada.');

  // Limpiar si ya había datos de intentos previos
  await pool.query('TRUNCATE TABLE imagenes_producto RESTART IDENTITY');

  // 2. Migrar datos desde productos.imagenes
  console.log('\n2. Leyendo productos y parseando imagenes JSON...');
  const productosRes = await pool.query<{ id: number; imagenes: string }>('SELECT id, imagenes FROM productos ORDER BY id ASC');
  
  let totalUrlsInJson = 0;
  let totalInserted = 0;

  for (const prod of productosRes.rows) {
    let urls: string[] = [];
    try {
      if (typeof prod.imagenes === 'string' && prod.imagenes.trim()) {
        urls = JSON.parse(prod.imagenes);
      } else if (Array.isArray(prod.imagenes)) {
        urls = prod.imagenes;
      }
    } catch (e) {
      console.warn(`⚠️ Error parseando imagenes para producto ID ${prod.id}:`, e);
      urls = [];
    }

    if (Array.isArray(urls)) {
      totalUrlsInJson += urls.length;
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        if (typeof url === 'string' && url.trim()) {
          await pool.query(
            'INSERT INTO imagenes_producto (producto_id, url, orden) VALUES ($1, $2, $3)',
            [prod.id, url.trim(), i]
          );
          totalInserted++;
        }
      }
    }
  }

  // 3. Verificación
  console.log('\n3. Verificando conteos:');
  const countRes = await pool.query<{ count: string }>('SELECT COUNT(*) as count FROM imagenes_producto');
  const dbCount = Number(countRes.rows[0].count);

  console.log(`- Total URLs en arreglos JSON originales: ${totalUrlsInJson}`);
  console.log(`- Total filas insertadas en imagenes_producto: ${totalInserted}`);
  console.log(`- Total registros en DB (SELECT COUNT): ${dbCount}`);

  if (totalUrlsInJson === dbCount && totalInserted === dbCount) {
    console.log('\n✅ VERIFICACIÓN EXITOSA: Coincidencia exacta de conteo (100% de imágenes migradas).');
  } else {
    console.error('\n❌ ERROR EN VERIFICACIÓN: Los conteos no coinciden.');
    process.exit(1);
  }

  process.exit(0);
}

runBlockA().catch(err => {
  console.error('Error en Bloque A:', err);
  process.exit(1);
});
