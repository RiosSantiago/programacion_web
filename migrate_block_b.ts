import { pool } from './src/lib/db.ts';

async function runBlockB() {
  console.log('=== BLOQUE B: CREACIÓN DE TABLA detalle_pedido Y VERIFICACIÓN ===\n');

  // 1. Verificación preliminar de registros en pedidos
  const countRes = await pool.query<{ count: string }>('SELECT COUNT(*) as count FROM pedidos');
  const pedidosCount = Number(countRes.rows[0].count);
  console.log(`1. Registros actuales en tabla pedidos: ${pedidosCount}`);

  if (pedidosCount > 0) {
    console.log('⚠️ Existen pedidos históricos. (Si los hubiera, requeriría migración de JSON a detalle_pedido)');
  } else {
    console.log('✅ Confirmado: 0 registros en pedidos. No hay JSON histórico que migrar.');
  }

  // 2. Crear la tabla detalle_pedido
  console.log('\n2. Creando tabla detalle_pedido...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS detalle_pedido (
        id SERIAL PRIMARY KEY,
        pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
        producto_id INTEGER REFERENCES productos(id) ON DELETE RESTRICT,
        cantidad INTEGER NOT NULL CHECK (cantidad > 0),
        precio_unitario NUMERIC(12, 2) NOT NULL
    );
  `);
  console.log('✅ Tabla detalle_pedido creada exitosamente.');

  // Verificación de estructura de la tabla creada
  const colsRes = await pool.query<{ column_name: string; data_type: string }>(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'detalle_pedido' ORDER BY ordinal_position`
  );
  console.log('\n3. Estructura verificada de detalle_pedido:');
  console.table(colsRes.rows);

  process.exit(0);
}

runBlockB().catch(err => {
  console.error('Error en Bloque B:', err);
  process.exit(1);
});
