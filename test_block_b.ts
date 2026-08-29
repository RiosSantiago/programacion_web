import { pool, queryGet, queryAll } from './src/lib/db.ts';

// ─────────────────────────────────────────────────────────────────────────────
// REGLA DE SCRIPTS DE PRUEBA: Todo INSERT debe ocurrir dentro de una
// transacción con ROLLBACK explícito al final para no dejar datos huérfanos.
// ─────────────────────────────────────────────────────────────────────────────

async function testBlockB() {
  console.log('=== TEST DE FUNCIONALIDAD DEL BLOQUE B (detalle_pedido) ===\n');

  // Obtener un usuario real de la BD para no violar FK
  const userRow = await queryGet<{ id: number }>('SELECT id FROM usuarios LIMIT 1', []);
  if (!userRow) {
    console.error('❌ No hay usuarios en la BD. No se puede continuar.');
    process.exit(1);
  }
  const userId = userRow.id;
  console.log(`- Usando usuario_id real: ${userId}`);

  // Obtener dos productos reales
  const prods = await queryAll<{ id: number, precio: number }>('SELECT id, precio FROM productos LIMIT 2', []);
  if (prods.length < 1) {
    console.error('❌ No hay productos en la BD.');
    process.exit(1);
  }

  const ordenId = `AG-TEST-${Date.now()}`;
  const items = prods.map(p => ({ id: p.id, cantidad: 1, precio: Number(p.precio) }));
  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const productosJson = JSON.stringify(items);

  console.log(`\n- OrdenId de prueba: ${ordenId}`);
  console.log(`- Items: ${JSON.stringify(items)}`);
  console.log('\n[Todos los INSERTs ocurren dentro de BEGIN/ROLLBACK — nada persiste]\n');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insertar pedido de prueba
    console.log('1. Probando creación de pedido con detalle_pedido...');
    const pedidoResult = await client.query(
      `INSERT INTO pedidos (orden_id, usuario_id, productos, total, metodo_pago,
         nombre_comprador, telefono_comprador, direccion, notas, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pendiente') RETURNING id`,
      [ordenId, userId, productosJson, total, 'efectivo',
       'Manuel Perez (TEST)', '3001234567', 'Calle TEST', 'Test ROLLBACK']
    );
    const pedidoId = pedidoResult.rows[0].id;
    console.log(`- Pedido insertado con ID temporal: ${pedidoId} (OrdenId: ${ordenId})`);

    // 2. Insertar detalles
    for (const item of items) {
      await client.query(
        `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario)
         VALUES ($1,$2,$3,$4)`,
        [pedidoId, item.id, item.cantidad, item.precio]
      );
    }

    // 3. Verificar filas en detalle_pedido (dentro de la transacción)
    console.log('\n2. Verificando filas creadas en tabla detalle_pedido...');
    const detalles = await client.query(
      'SELECT * FROM detalle_pedido WHERE pedido_id = $1 ORDER BY id ASC',
      [pedidoId]
    );
    console.table(detalles.rows);
    if (detalles.rows.length === items.length) {
      console.log(`✅ Coincidencia exacta: ${items.length} filas en detalle_pedido.`);
    } else {
      console.error(`❌ Error: esperadas ${items.length}, encontradas ${detalles.rows.length}.`);
      await client.query('ROLLBACK');
      client.release();
      process.exit(1);
    }

    // 4. Consultar pedido con JOIN
    console.log('\n3. Consultando pedido con JOIN a detalle_pedido y productos...');
    const join = await client.query(
      `SELECT d.id as detalle_id, d.pedido_id, d.producto_id, d.cantidad, d.precio_unitario,
              p.nombre as producto_nombre
       FROM detalle_pedido d
       JOIN productos p ON d.producto_id = p.id
       WHERE d.pedido_id = $1`,
      [pedidoId]
    );
    console.table(join.rows);

    // 5. Verificar ON DELETE CASCADE (dentro de la transacción, antes del ROLLBACK)
    console.log('\n4. Verificando ON DELETE CASCADE en detalle_pedido...');
    await client.query('DELETE FROM pedidos WHERE id = $1', [pedidoId]);
    const postDel = await client.query('SELECT * FROM detalle_pedido WHERE pedido_id = $1', [pedidoId]);
    if (postDel.rows.length === 0) {
      console.log('✅ ON DELETE CASCADE funcionó: los detalles se eliminaron al borrar el pedido.');
    } else {
      console.error('❌ Error en ON DELETE CASCADE');
      await client.query('ROLLBACK');
      client.release();
      process.exit(1);
    }

    // ROLLBACK final: ningún dato de prueba persiste en la BD
    await client.query('ROLLBACK');
    console.log('\n✅ ROLLBACK ejecutado — la BD queda exactamente como estaba antes del test.');

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  // 6. Verificar estado final externo (fuera de transacción)
  console.log('\n5. Verificando estado final de la BD (conteos externos)...');
  const count = await queryGet<{ count: string }>('SELECT COUNT(*) as count FROM pedidos', []);
  console.log(`   Registros en pedidos después del ROLLBACK: ${count?.count ?? 0}`);

  console.log('\n✅ PRUEBA DEL BLOQUE B COMPLETADA EXITOSAMENTE.');
  process.exit(0);
}

testBlockB().catch(err => {
  console.error('Error en test de Bloque B:', err);
  process.exit(1);
});
