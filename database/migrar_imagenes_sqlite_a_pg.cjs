// =============================================================================
// MIGRACIÓN: SQLite (agroup.db) → PostgreSQL (Docker)
// Migra productos + imágenes + categorías + usuarios + inventario
// =============================================================================
const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');

const SQLITE_PATH = path.join(__dirname, 'agroup.db');
const PG_URL = 'postgresql://postgres:postgrespassword@localhost:5433/agroup';

const sqlite = new Database(SQLITE_PATH, { readonly: true });
const pg = new Pool({ connectionString: PG_URL, ssl: false });

async function run() {
  console.log('=== MIGRACIÓN SQLite → PostgreSQL ===\n');

  // --- 1. Limpiar datos seed actuales (en orden inverso de FK) ---
  console.log('1. Limpiando datos existentes...');
  await pg.query('DELETE FROM imagenes_producto');
  await pg.query('DELETE FROM detalle_pedido');
  await pg.query('DELETE FROM vistas_vendedor');
  await pg.query('DELETE FROM pedidos');
  await pg.query('DELETE FROM indicadores_crecimiento');
  await pg.query('DELETE FROM dashboard_estadisticas');
  await pg.query('DELETE FROM inventario');
  await pg.query('DELETE FROM productos');
  await pg.query('DELETE FROM usuarios');
  await pg.query('DELETE FROM categorias');
  console.log('   Tablas limpiadas OK\n');

  // --- 2. Migrar CATEGORÍAS ---
  console.log('2. Migrando categorías...');
  let catRows;
  try {
    catRows = sqlite.prepare('SELECT * FROM categorias').all();
  } catch (e) {
    console.log('   Error leyendo categorías de SQLite:', e.message);
    console.log('   Intentando sin columna icono/color...');
    try {
      catRows = sqlite.prepare('SELECT id, nombre FROM categorias').all();
    } catch (e2) {
      console.log('   Tabla categorias no existe en SQLite, usando defaults');
      catRows = [];
    }
  }

  const catDefaults = {
    'Bovinos':     { icono: '🐄', color: 'bg-gold-100 text-gold-700' },
    'Equinos':     { icono: '🐴', color: 'bg-blue-100 text-blue-700' },
    'Porcinos':    { icono: '🐷', color: 'bg-coral-100 text-coral-700' },
    'Ovinos':      { icono: '🐑', color: 'bg-purple-100 text-purple-700' },
    'Avícolas':    { icono: '🐔', color: 'bg-orange-100 text-orange-700' },
    'Avicolas':    { icono: '🐔', color: 'bg-orange-100 text-orange-700' },
    'Agricultura': { icono: '🌱', color: 'bg-campo-100 text-campo-700' },
    'Insumos':     { icono: '🧰', color: 'bg-stone-100 text-stone-700' },
    'Servicios':   { icono: '🔧', color: 'bg-stone-100 text-stone-700' },
    'Cultivos':    { icono: '🌾', color: 'bg-campo-100 text-campo-700' },
  };

  for (const cat of catRows) {
    const defaults = catDefaults[cat.nombre] || { icono: '📦', color: 'bg-gray-100 text-gray-700' };
    await pg.query(
      'INSERT INTO categorias (id, nombre, icono, color, cantidad) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING',
      [cat.id, cat.nombre, cat.icono || defaults.icono, cat.color || defaults.color, cat.cantidad || 0]
    );
  }
  console.log('   ' + catRows.length + ' categorías migradas\n');

  // --- 3. Migrar USUARIOS ---
  console.log('3. Migrando usuarios...');
  let userRows;
  try {
    userRows = sqlite.prepare('SELECT * FROM usuarios').all();
  } catch (e) {
    console.log('   Error leyendo usuarios:', e.message);
    userRows = [];
  }

  for (const u of userRows) {
    await pg.query(
      `INSERT INTO usuarios (id, email, celular, nombre, password_hash, password_text, verificado, rol,
        hacienda, ciudad, direccion, municipio, corregimiento, departamento, whatsapp, descripcion, especies, logo, portada, avatar, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       ON CONFLICT (id) DO NOTHING`,
      [
        u.id, u.email, u.celular, u.nombre,
        u.password_hash || null, u.password_text || '',
        u.verificado || false, u.rol || 'comprador',
        u.hacienda || '', u.ciudad || '', u.direccion || '', u.municipio || '',
        u.corregimiento || '', u.departamento || '', u.whatsapp || '',
        u.descripcion || '', u.especies || '[]', u.logo || '', u.portada || '',
        u.avatar || null, u.created_at || new Date().toISOString()
      ]
    );
  }
  console.log('   ' + userRows.length + ' usuarios migrados\n');

  // --- 4. Migrar PRODUCTOS ---
  console.log('4. Migrando productos...');
  const prodRows = sqlite.prepare('SELECT * FROM productos').all();

  for (const p of prodRows) {
    await pg.query(
      `INSERT INTO productos (id, nombre, categoria, categoria_id, raza, peso, peso_unitario,
        ubicacion, departamento, precio, precio_anterior, stock, vendedor_id, vendedor_rating,
        estado, salud, envio, destacado, oferta, trazabilidad, tipo_precio, sexo,
        fecha_nacimiento, descripcion, video, finca, vereda, referencia_ubicacion, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)
       ON CONFLICT (id) DO NOTHING`,
      [
        p.id, p.nombre, p.categoria || '', p.categoria_id || null,
        p.raza || null, p.peso || null, p.peso_unitario || null,
        p.ubicacion || '', p.departamento || '', p.precio || 0,
        p.precio_anterior || null, p.stock || 0, p.vendedor_id || null,
        p.vendedor_rating || null, p.estado || 'disponible', p.salud || 'Bueno',
        p.envio === 1 || p.envio === true, p.destacado === 1 || p.destacado === true,
        p.oferta === 1 || p.oferta === true, p.trazabilidad === 1 || p.trazabilidad === true,
        p.tipo_precio || 'fijo', p.sexo || null,
        p.fecha_nacimiento || '', p.descripcion || '', p.video || '',
        p.finca || '', p.vereda || '', p.referencia_ubicacion || '',
        p.created_at || new Date().toISOString()
      ]
    );
  }
  console.log('   ' + prodRows.length + ' productos migrados\n');

  // --- 5. Migrar IMÁGENES (desde JSON array de SQLite → filas en imagenes_producto) ---
  console.log('5. Migrando imágenes...');
  let totalImg = 0;

  for (const p of prodRows) {
    let imagenes = [];
    if (p.imagenes) {
      try {
        imagenes = JSON.parse(p.imagenes);
        if (!Array.isArray(imagenes)) imagenes = [imagenes];
      } catch (e) {
        // If it's a single URL string, not JSON
        if (typeof p.imagenes === 'string' && p.imagenes.trim()) {
          imagenes = [p.imagenes.trim()];
        }
      }
    }

    for (let i = 0; i < imagenes.length; i++) {
      const url = imagenes[i];
      if (!url || !url.trim()) continue;

      // Normalize URL: ensure it starts with / for local paths
      const normalizedUrl = url.startsWith('/') ? url : '/' + url;

      await pg.query(
        'INSERT INTO imagenes_producto (producto_id, url, orden) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [p.id, normalizedUrl, i]
      );
      totalImg++;
    }
  }
  console.log('   ' + totalImg + ' imágenes migradas\n');

  // --- 6. Migrar INVENTARIO ---
  console.log('6. Migrando inventario...');
  let invRows;
  try {
    invRows = sqlite.prepare('SELECT * FROM inventario').all();
    for (const inv of invRows) {
      await pg.query(
        'INSERT INTO inventario (id, codigo, nombre, raza, edad, peso, ubicacion, estado, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING',
        [inv.id, inv.codigo, inv.nombre, inv.raza, inv.edad, inv.peso, inv.ubicacion, inv.estado, inv.created_at || new Date().toISOString()]
      );
    }
    console.log('   ' + invRows.length + ' items de inventario migrados\n');
  } catch (e) {
    console.log('   Inventario no encontrado o vacío:', e.message, '\n');
  }

  // --- 7. Migrar DASHBOARD + INDICADORES ---
  console.log('7. Migrando dashboard_estadisticas e indicadores_crecimiento...');
  try {
    const dash = sqlite.prepare('SELECT * FROM dashboard_estadisticas').all();
    for (const d of dash) {
      await pg.query(
        `INSERT INTO dashboard_estadisticas (id, total_cabezas, alertas_salud, promedio_peso, crecimiento_mensual, rendimiento_promedio, produccion_leche)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
        [d.id, d.total_cabezas, d.alertas_salud, d.promedio_peso, d.crecimiento_mensual, d.rendimiento_promedio, d.produccion_leche]
      );
    }
    console.log('   Dashboard: ' + dash.length + ' rows');
  } catch (e) { console.log('   Dashboard no encontrado:', e.message); }

  try {
    const ind = sqlite.prepare('SELECT * FROM indicadores_crecimiento').all();
    for (const i of ind) {
      await pg.query(
        'INSERT INTO indicadores_crecimiento (id, mes, peso, produccion) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING',
        [i.id, i.mes, i.peso, i.produccion]
      );
    }
    console.log('   Indicadores: ' + ind.length + ' rows\n');
  } catch (e) { console.log('   Indicadores no encontrados:', e.message, '\n'); }

  // --- 8. Reporte final ---
  console.log('=== REPORTE DE VERIFICACIÓN ===');
  const tables = ['categorias', 'usuarios', 'productos', 'imagenes_producto', 'inventario', 'dashboard_estadisticas', 'indicadores_crecimiento'];
  for (const t of tables) {
    try {
      const res = await pg.query('SELECT COUNT(*) AS count FROM ' + t);
      console.log('   ' + t + ': ' + res.rows[0].count + ' registros');
    } catch (e) {
      console.log('   ' + t + ': ERROR - ' + e.message);
    }
  }

  console.log('\n=== MIGRACIÓN COMPLETADA ===');
  sqlite.close();
  await pg.end();
}

run().catch(function(err) {
  console.error('FATAL:', err.message);
  process.exit(1);
});
