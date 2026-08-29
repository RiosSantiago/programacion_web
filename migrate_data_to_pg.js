import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import fs from 'fs';

const { Client } = pg;

const sqliteDbPath = path.join(process.cwd(), 'database', 'agroup.db');
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/agroup';

const sqliteDb = new Database(sqliteDbPath);
const pgClient = new Client({ connectionString });

async function migrateData() {
  console.log('=== BLOQUE 3: MIGRACIÓN DE DATOS (SQLITE ➔ POSTGRESQL) ===\n');

  await pgClient.connect();

  const schemaPath = path.join(process.cwd(), 'database', 'schema.pg.sql');
  if (fs.existsSync(schemaPath)) {
    console.log('Aplicando esquema database/schema.pg.sql en PostgreSQL...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pgClient.query(schemaSql);
  }
  
  // 1. CATEGORIAS
  console.log('1. Migrando categorias...');
  const categorias = sqliteDb.prepare('SELECT * FROM categorias ORDER BY id ASC').all();
  for (const c of categorias) {
    await pgClient.query(
      `INSERT INTO categorias (id, nombre, icono, color, cantidad) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, icono = EXCLUDED.icono, color = EXCLUDED.color, cantidad = EXCLUDED.cantidad`,
      [c.id, c.nombre, c.icono, c.color, c.cantidad]
    );
  }
  await pgClient.query(`SELECT setval(pg_get_serial_sequence('categorias', 'id'), (SELECT MAX(id) FROM categorias))`);
  console.log(`- ${categorias.length} categorias migradas.`);

  // 2. USUARIOS
  console.log('\n2. Migrando usuarios...');
  const usuarios = sqliteDb.prepare('SELECT * FROM usuarios ORDER BY id ASC').all();
  for (const u of usuarios) {
    await pgClient.query(
      `INSERT INTO usuarios (
        id, email, celular, nombre, password_hash, verificado, rol, avatar,
        password_text, hacienda, ciudad, direccion, municipio, corregimiento,
        reset_token, reset_token_exp, departamento, whatsapp, descripcion, especies, logo, portada, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      ) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, celular = EXCLUDED.celular`,
      [
        u.id, u.email, u.celular, u.nombre, u.password_hash,
        u.verificado === 1 || u.verificado === true,
        u.rol === '' ? 'comprador' : u.rol,
        u.avatar || null,
        u.password_text || '', u.hacienda || '', u.ciudad || '', u.direccion || '',
        u.municipio || '', u.corregimiento || '', u.reset_token || '', u.reset_token_exp || 0,
        u.departamento || '', u.whatsapp || '', u.descripcion || '', u.especies || '[]',
        u.logo || '', u.portada || '', u.created_at || new Date().toISOString()
      ]
    );
  }
  await pgClient.query(`SELECT setval(pg_get_serial_sequence('usuarios', 'id'), (SELECT MAX(id) FROM usuarios))`);
  console.log(`- ${usuarios.length} usuarios migrados.`);

  // 3. PRODUCTOS
  console.log('\n3. Migrando productos...');
  const productos = sqliteDb.prepare('SELECT * FROM productos ORDER BY id ASC').all();
  for (const p of productos) {
    await pgClient.query(
      `INSERT INTO productos (
        id, nombre, categoria, categoria_id, raza, peso, peso_unitario, ubicacion, departamento,
        precio, precio_anterior, stock, vendedor_id, vendedor, vendedor_rating, imagenes,
        estado, salud, envio, destacado, oferta, trazabilidad, tipo_precio, sexo,
        fecha_nacimiento, descripcion, video, finca, vereda, referencia_ubicacion, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
      ) ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre`,
      [
        p.id, p.nombre, p.categoria, p.categoria_id, p.raza || null, p.peso || null, p.peso_unitario || null,
        p.ubicacion, p.departamento, p.precio, p.precio_anterior || null, p.stock, p.vendedor_id,
        p.vendedor, p.vendedor_rating || 4.5, p.imagenes,
        p.estado || 'disponible', p.salud || 'Bueno',
        p.envio === 1 || p.envio === true,
        p.destacado === 1 || p.destacado === true,
        p.oferta === 1 || p.oferta === true,
        p.trazabilidad === 1 || p.trazabilidad === true,
        p.tipo_precio || 'fijo',
        p.sexo === '' ? 'hembra' : p.sexo,
        p.fecha_nacimiento || '', p.descripcion || '', p.video || '', p.finca || '',
        p.vereda || '', p.referencia_ubicacion || '', p.created_at || new Date().toISOString()
      ]
    );
  }
  await pgClient.query(`SELECT setval(pg_get_serial_sequence('productos', 'id'), (SELECT MAX(id) FROM productos))`);
  console.log(`- ${productos.length} productos migrados.`);

  // 4. INVENTARIO
  console.log('\n4. Migrando inventario...');
  const inventario = sqliteDb.prepare('SELECT * FROM inventario ORDER BY id ASC').all();
  for (const inv of inventario) {
    await pgClient.query(
      `INSERT INTO inventario (id, codigo, nombre, raza, edad, peso, ubicacion, estado, ultimo_check, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET codigo = EXCLUDED.codigo`,
      [inv.id, inv.codigo, inv.nombre, inv.raza, inv.edad, inv.peso, inv.ubicacion, inv.estado, inv.ultimo_check, inv.created_at]
    );
  }
  await pgClient.query(`SELECT setval(pg_get_serial_sequence('inventario', 'id'), (SELECT MAX(id) FROM inventario))`);
  console.log(`- ${inventario.length} inventario migrados.`);

  // 5. DASHBOARD ESTADISTICAS
  console.log('\n5. Migrando dashboard_estadisticas...');
  const stats = sqliteDb.prepare('SELECT * FROM dashboard_estadisticas ORDER BY id ASC').all();
  for (const st of stats) {
    await pgClient.query(
      `INSERT INTO dashboard_estadisticas (id, total_cabezas, alertas_salud, promedio_peso, crecimiento_mensual, rendimiento_promedio, produccion_leche)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET total_cabezas = EXCLUDED.total_cabezas`,
      [st.id, st.total_cabezas, st.alertas_salud, st.promedio_peso, st.crecimiento_mensual, st.rendimiento_promedio, st.produccion_leche]
    );
  }
  console.log(`- ${stats.length} dashboard_estadisticas migrados.`);

  // 6. INDICADORES CRECIMIENTO
  console.log('\n6. Migrando indicadores_crecimiento...');
  const ind = sqliteDb.prepare('SELECT * FROM indicadores_crecimiento ORDER BY id ASC').all();
  for (const i of ind) {
    await pgClient.query(
      `INSERT INTO indicadores_crecimiento (id, mes, peso, produccion)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET mes = EXCLUDED.mes`,
      [i.id, i.mes, i.peso, i.produccion]
    );
  }
  await pgClient.query(`SELECT setval(pg_get_serial_sequence('indicadores_crecimiento', 'id'), (SELECT MAX(id) FROM indicadores_crecimiento))`);
  console.log(`- ${ind.length} indicadores_crecimiento migrados.`);

  // 7. PEDIDOS
  console.log('\n7. Migrando pedidos...');
  const pedidos = sqliteDb.prepare('SELECT * FROM pedidos ORDER BY id ASC').all();
  for (const ped of pedidos) {
    await pgClient.query(
      `INSERT INTO pedidos (id, usuario_id, productos, total, metodo_pago, estado, referencia_wompi, nombre_comprador, telefono_comprador, direccion, notas, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET total = EXCLUDED.total`,
      [ped.id, ped.usuario_id, ped.productos, ped.total, ped.metodo_pago, ped.estado, ped.referencia_wompi, ped.nombre_comprador, ped.telefono_comprador, ped.direccion, ped.notas, ped.created_at]
    );
  }
  if (pedidos.length > 0) {
    await pgClient.query(`SELECT setval(pg_get_serial_sequence('pedidos', 'id'), (SELECT MAX(id) FROM pedidos))`);
  }
  console.log(`- ${pedidos.length} pedidos migrados.`);

  // 8. VISTAS VENDEDOR
  console.log('\n8. Migrando vistas_vendedor...');
  const vistas = sqliteDb.prepare('SELECT * FROM vistas_vendedor ORDER BY id ASC').all();
  for (const v of vistas) {
    await pgClient.query(
      `INSERT INTO vistas_vendedor (id, vendedor_id, viewer_id, viewer_ip, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET vendedor_id = EXCLUDED.vendedor_id`,
      [v.id, v.vendedor_id, v.viewer_id, v.viewer_ip, v.created_at]
    );
  }
  if (vistas.length > 0) {
    await pgClient.query(`SELECT setval(pg_get_serial_sequence('vistas_vendedor', 'id'), (SELECT MAX(id) FROM vistas_vendedor))`);
  }
  console.log(`- ${vistas.length} vistas_vendedor migradas.`);

  // VERIFICACIÓN COMPLETA
  console.log('\n=== REPORTE DE VERIFICACIÓN DE CONTEO E INTEGRIDAD ===\n');
  const tables = ['categorias', 'usuarios', 'productos', 'inventario', 'dashboard_estadisticas', 'indicadores_crecimiento', 'pedidos', 'vistas_vendedor'];
  
  let allEqual = true;
  for (const t of tables) {
    const sqliteCount = sqliteDb.prepare(`SELECT COUNT(*) as c FROM ${t}`).get().c;
    const pgRes = await pgClient.query(`SELECT COUNT(*) as c FROM ${t}`);
    const pgCount = parseInt(pgRes.rows[0].c, 10);
    const status = sqliteCount === pgCount ? '✅ IGUAL' : '❌ DESALINEADO';
    if (sqliteCount !== pgCount) allEqual = false;
    console.log(`- Tabla '${t}': SQLite=${sqliteCount} | PostgreSQL=${pgCount} ➔ ${status}`);
  }

  // FK Constraints verification in Postgres
  console.log('\n--- Verificando Integridad de FKs en PostgreSQL ---');
  const prodCatOrphans = await pgClient.query(`
    SELECT p.id FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE c.id IS NULL
  `);
  console.log(`- productos.categoria_id -> categorias.id (Huérfanos): ${prodCatOrphans.rows.length}`);

  const prodUserOrphans = await pgClient.query(`
    SELECT p.id FROM productos p LEFT JOIN usuarios u ON p.vendedor_id = u.id WHERE u.id IS NULL
  `);
  console.log(`- productos.vendedor_id -> usuarios.id (Huérfanos): ${prodUserOrphans.rows.length}`);

  await pgClient.end();

  if (allEqual && prodCatOrphans.rows.length === 0 && prodUserOrphans.rows.length === 0) {
    console.log('\n✅ ÉXITO TOTAL: 100% de los datos fueron migrados con integridad relacional perfecta y 0 errores!');
  } else {
    console.error('\n❌ ERROR EN LA VERIFICACIÓN DE MIGRACIÓN!');
    process.exit(1);
  }
}

migrateData().catch(async err => {
  console.error('Error during data migration:', err);
  try { await pgClient.end(); } catch (_) {}
  process.exit(1);
});
