import { getProductos, getProductoById, filtrarProductos } from './src/lib/models/productos.ts';
import { getCategorias } from './src/lib/models/categorias.ts';
import { getInventario, getEstadisticas } from './src/lib/models/inventario.ts';

// ─────────────────────────────────────────────────────────────────────────────
// REGLA DE SCRIPTS DE PRUEBA: Todo INSERT debe ocurrir dentro de una
// transacción con ROLLBACK explícito al final para no dejar datos huérfanos.
// ─────────────────────────────────────────────────────────────────────────────

async function testMarketplaceFlows() {
  console.log('=== BLOQUE 5: PRUEBAS LOCALES DEL MARKETPLACE CONTRA POSTGRESQL ===\n');

  // 1. Obtener Categorías
  console.log('1. Probando getCategorias()...');
  const cats = await getCategorias();
  console.log(`- ${cats.length} categorías obtenidas:`, cats.map(c => `${c.nombre} (id:${c.id})`));

  // 2. Obtener Productos Totales
  console.log('\n2. Probando getProductos()...');
  const prods = await getProductos();
  console.log(`- Total productos en PostgreSQL: ${prods.length}`);

  // 3. Filtrar por Categoría (Bovinos = 1)
  console.log('\n3. Probando filtrarProductos({ categoria: "1" })...');
  const bovinos = await filtrarProductos({ categoria: '1' });
  console.log(`- ${bovinos.length} productos bovinos filtrados.`);

  // 4. Búsqueda de Texto ("Angus")
  console.log('\n4. Probando filtrarProductos({ busqueda: "Angus" })...');
  const angus = await filtrarProductos({ busqueda: 'Angus' });
  console.log(`- ${angus.length} productos coincidentes con 'Angus':`, angus.map(p => p.nombre));

  // 5. Obtener Producto por ID (36)
  console.log('\n5. Probando getProductoById(36)...');
  const p36 = await getProductoById(36);
  console.log('- Producto 36:', p36 ? `${p36.nombre} - Precio: $${p36.precio}` : 'No encontrado');

  // 6. Publicar un Producto Nuevo — TRANSACCIÓN CON ROLLBACK
  console.log('\n6. Probando INSERT de producto [transacción con ROLLBACK — no persiste]...');
  const { pool } = await import('./src/lib/db.ts');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userRes = await client.query('SELECT id FROM usuarios LIMIT 1');
    const validUserId = userRes.rows[0]?.id || null;
    const result = await client.query(
      `INSERT INTO productos
         (nombre, categoria, categoria_id, precio, stock, ubicacion, departamento, vendedor_id, descripcion, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'disponible')
       RETURNING id`,
      ['Novillo de Prueba Postgres', 'bovino', 1, 4500000, 5,
       'Medellín', 'Antioquia', validUserId, 'Producto de prueba inserción Postgres']
    );
    const tempId = result.rows[0].id;
    console.log(`  INSERT exitoso en productos con ID temporal: ${tempId}`);

    await client.query(
      `INSERT INTO imagenes_producto (producto_id, url, orden) VALUES ($1, $2, $3)`,
      [tempId, '/images/ganado.svg', 0]
    );
    console.log(`  INSERT exitoso en imagenes_producto para el producto ${tempId}`);

    // Verificar visibilidad dentro de la transacción
    const check = await client.query('SELECT id, nombre FROM productos WHERE id = $1', [tempId]);
    console.log(`  Verificación intra-transacción: ${check.rows[0]?.nombre ?? 'ERROR'} (ID: ${tempId})`);

    await client.query('ROLLBACK');
    console.log(`  ROLLBACK ejecutado — ID ${tempId} NO persiste en la BD. ✅`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  // 7. Inventario y Estadísticas
  console.log('\n7. Probando getInventario() y getEstadisticas()...');
  const inv = await getInventario();
  const stats = await getEstadisticas();
  console.log(`- Inventario: ${inv.length} animales.`);
  console.log(`- Estadísticas Dashboard: Total cabezas=${stats.totalCabezas}, Alertas=${stats.alertasSalud}`);

  console.log('\n✅ PRUEBAS DE FLUJO DE MARKETPLACE COMPLETADAS EXITOSAMENTE CONTRA POSTGRESQL!');
}

testMarketplaceFlows().catch(err => {
  console.error('Error durante las pruebas de marketplace:', err);
  process.exit(1);
});
