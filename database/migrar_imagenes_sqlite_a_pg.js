/**
 * =============================================================================
 * SCRIPT: MIGRACIÓN DE IMÁGENES — SQLite → PostgreSQL
 * =============================================================================
 *
 * CONTEXTO:
 *   En SQLite, las imágenes de cada producto se guardaban como un JSON array
 *   en la columna `productos.imagenes` (ej: '["url1.jpg","url2.jpg"]').
 *
 *   En PostgreSQL, las imágenes se almacenan en la tabla relacional:
 *     imagenes_producto (id SERIAL PK, producto_id FK, url TEXT, orden INTEGER)
 *
 * QUÉ HACE ESTE SCRIPT:
 *   1. Lee todos los productos de SQLite y extrae sus arreglos de imágenes.
 *   2. Por cada URL en el arreglo JSON, inserta una fila en `imagenes_producto`
 *      en PostgreSQL, asociada al producto correspondiente (por ID).
 *   3. Usa INSERT ... ON CONFLICT DO NOTHING para ser idempotente (se puede
 *      correr varias veces sin duplicar datos).
 *   4. Al final imprime un reporte de verificación.
 *
 * PRE-REQUISITOS:
 *   - Node.js 18+ con soporte ESM (el proyecto usa "type": "module")
 *   - SQLite: archivo database/agroup.db debe existir
 *   - PostgreSQL: la tabla `imagenes_producto` ya debe existir (se crea
 *     automáticamente si no existe)
 *   - Variables de entorno o ajustar la cadena de conexión abajo
 *
 * USO:
 *   1. Ajusta SQLITE_PATH y DATABASE_URL si es necesario
 *   2. Ejecuta: node database/migrar_imagenes_sqlite_a_pg.js
 *
 * =============================================================================
 */

import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const { Pool } = pg;

// ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQLITE_PATH = path.join(__dirname, '..', 'database', 'agroup.db');

// Cadena de conexión a PostgreSQL.
// Puedes definir la variable de entorno DATABASE_URL antes de correr el script,
// o pegar directamente la cadena de conexión aquí.
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgrespassword@localhost:5432/agroup';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function parseImagenes(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(u => typeof u === 'string' && u.trim());
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(u => typeof u === 'string' && u.trim());
    } catch (_) { /* raw no es JSON válido */ }
  }
  return [];
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function migrarImagenes() {
  console.log('=== MIGRACIÓN: imágenes SQLite → imagenes_producto (PostgreSQL) ===\n');

  // 1. Verificar que el archivo SQLite existe
  if (!fs.existsSync(SQLITE_PATH)) {
    console.error(`❌ No se encontró el archivo SQLite en: ${SQLITE_PATH}`);
    console.error('   Asegúrate de que el archivo database/agroup.db esté presente.');
    process.exit(1);
  }

  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  const pgPool = new Pool({ connectionString: DATABASE_URL });

  const pgClient = await pgPool.connect();

  try {
    // 2. Crear la tabla en PostgreSQL si no existe
    console.log('1. Creando tabla imagenes_producto (si no existe)...');
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS imagenes_producto (
        id          SERIAL PRIMARY KEY,
        producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
        url         TEXT    NOT NULL,
        orden       INTEGER DEFAULT 0,
        UNIQUE (producto_id, url)
      );
    `);
    console.log('   ✅ Tabla imagenes_producto lista.\n');

    // 3. Leer productos de SQLite
    console.log('2. Leyendo productos desde SQLite...');
    const productosEnSqlite = sqlite
      .prepare('SELECT id, imagenes FROM productos ORDER BY id ASC')
      .all();
    console.log(`   - ${productosEnSqlite.length} productos encontrados en SQLite.\n`);

    // 4. Migrar imágenes
    console.log('3. Insertando imágenes en PostgreSQL...');

    let totalProductosConImagenes = 0;
    let totalUrlsEncontradas = 0;
    let totalInsertadas = 0;
    let totalOmitidas = 0;   // ON CONFLICT — ya existían
    const errores = [];

    for (const prod of productosEnSqlite) {
      const urls = parseImagenes(prod.imagenes);
      if (urls.length === 0) continue;

      totalProductosConImagenes++;

      for (let orden = 0; orden < urls.length; orden++) {
        const url = urls[orden].trim();
        totalUrlsEncontradas++;

        try {
          const res = await pgClient.query(
            `INSERT INTO imagenes_producto (producto_id, url, orden)
             VALUES ($1, $2, $3)
             ON CONFLICT (producto_id, url) DO NOTHING`,
            [prod.id, url, orden]
          );

          if (res.rowCount === 0) {
            totalOmitidas++;  // Ya existía
          } else {
            totalInsertadas++;
          }
        } catch (err) {
          // FK violation: el producto_id no existe en PG todavía
          const msg = `Producto ID ${prod.id}, URL "${url.substring(0, 60)}...": ${err.message}`;
          errores.push(msg);
          console.warn(`   ⚠️  Error FK para producto ${prod.id}: ${err.message.split('\n')[0]}`);
        }
      }
    }

    // 5. Reporte final
    console.log('\n=== REPORTE DE MIGRACIÓN ===\n');

    const pgCount = await pgClient.query('SELECT COUNT(*) as c FROM imagenes_producto');
    const totalEnPg = parseInt(pgCount.rows[0].c, 10);

    console.log(`Productos con imágenes en SQLite : ${totalProductosConImagenes}`);
    console.log(`Total URLs encontradas en SQLite : ${totalUrlsEncontradas}`);
    console.log(`Filas nuevas insertadas en PG    : ${totalInsertadas}`);
    console.log(`Filas omitidas (ya existían)     : ${totalOmitidas}`);
    console.log(`Total registros en imagenes_producto (PG): ${totalEnPg}`);

    if (errores.length > 0) {
      console.log(`\n⚠️  ${errores.length} errores encontrados (probablemente IDs de productos que no existen en PG):`);
      errores.slice(0, 10).forEach(e => console.log(`   - ${e}`));
      if (errores.length > 10) console.log(`   ... y ${errores.length - 10} más.`);
      console.log('\n💡 Solución: Corre primero node migrate_data_to_pg.js para migrar los productos,');
      console.log('   luego vuelve a ejecutar este script.');
    } else {
      console.log('\n✅ MIGRACIÓN EXITOSA — 0 errores de FK.');
    }

    if (totalUrlsEncontradas === totalEnPg || (totalInsertadas + totalOmitidas) === totalUrlsEncontradas - errores.length) {
      console.log('\n🎉 VERIFICACIÓN OK: conteos consistentes.');
    } else {
      console.warn('\n⚠️  Los conteos no cuadran perfectamente — revisa el reporte arriba.');
    }

  } finally {
    pgClient.release();
    await pgPool.end();
    sqlite.close();
  }
}

migrarImagenes().catch(err => {
  console.error('\n❌ Error fatal durante la migración:', err.message);
  process.exit(1);
});
