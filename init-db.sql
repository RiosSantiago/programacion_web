-- =============================================================================
-- AGROUP — SEED STAGING (datos realistas de prueba, sin PII real)
-- -----------------------------------------------------------------------------
-- Entorno B (Staging / pruebas oficiales) — informe-proyecto-agroup.pdf §3.
-- Se ejecuta automáticamente la PRIMERA vez que se crea el volumen de
-- postgres_staging_data (montado en /docker-entrypoint-initdb.d/02-seed.sql).
-- El esquema ya existe porque 01-schema.sql (database/schema.pg.sql) corre
-- antes en orden alfabético (las tablas también se auto-crean en arranque,
-- informe §3.3: inicialización en src/lib/db.ts).
--
-- Usuarios de prueba (contraseña para todos: Test1234)
--   admin@test.local      -> rol admin
--   vendedor@test.local   -> rol vendedor
--   comprador@test.local  -> rol comprador
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CATEGORÍAS (idempotente: si la categoría ya existe no la repite)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO categorias (nombre, slug, icono, color, cantidad) VALUES
  ('Bovinos',    'bovinos',    '🐄', 'bg-campo-100 text-campo-700', 1),
  ('Porcinos',   'porcinos',   '🐖', 'bg-coral-100 text-coral-600', 1),
  ('Agricultura','agricultura','🌱', 'bg-gold-100 text-gold-600',   1)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. USUARIOS DE PRUEBA
-- password_hash = bcrypt('Test1234') — hash generado y verificado con bcryptjs
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO usuarios (email, password_hash, nombre, rol, verificado) VALUES
  ('admin@test.local',    '$2a$12$mVBbKywChvUxV3x3aoQBDunpDgWj1feXZ1Jn6KHSev7zCF0t11e7a', 'Admin Test',    'admin',    true),
  ('vendedor@test.local', '$2a$12$mVBbKywChvUxV3x3aoQBDunpDgWj1feXZ1Jn6KHSev7zCF0t11e7a', 'Vendedor Test', 'vendedor', true),
  ('comprador@test.local','$2a$12$mVBbKywChvUxV3x3aoQBDunpDgWj1feXZ1Jn6KHSev7zCF0t11e7a', 'Comprador Test','comprador', true)
ON CONFLICT (email) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PRODUCTOS DE PRUEBA
-- Nota: la tabla exige ubicacion y departamento (NOT NULL). Se usan subconsultas
-- para no depender de ids fijos.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO productos (
  vendedor_id, nombre, descripcion, categoria, categoria_id,
  precio, precio_unitario, stock, ubicacion, departamento,
  raza, estado, salud, envio, destacado, oferta, tipo_precio
)
SELECT
  (SELECT id FROM usuarios WHERE email = 'vendedor@test.local'),
  p.nombre, p.descripcion, p.categoria,
  (SELECT id FROM categorias WHERE slug = p.categoria),
  p.precio, p.precio_unitario, p.stock, p.ubicacion, p.departamento,
  p.raza, 'disponible', 'Excelente', true,
  p.destacado, p.oferta, 'fijo'
FROM (VALUES
  ('Vacas Holstein',    'Vacas de raza Holstein para producción de leche. Lotes de alta genética listos para ordeño.', 'bovinos',     50000000::numeric, 2500000::numeric, 5,  'Manizales',    'Caldas',    'Holstein', true,  false),
  ('Cerdos Pietrain',   'Cerdos jóvenes de raza Pietrain para engorde. Excelente conversión alimenticia.',               'porcinos',    15000000::numeric, 1500000::numeric, 10, 'Dosquebradas', 'Risaralda', 'Pietrain', true,  false),
  ('Frutas Orgánicas',  'Frutas frescas de la finca, cosecha de temporada. Entrega directa del productor.',              'agricultura', 200000::numeric,   20000::numeric,   100,'Manizales',    'Caldas',    'Variadas', true,  false)
) AS p(nombre, descripcion, categoria, precio, precio_unitario, stock, ubicacion, departamento, raza, destacado, oferta)
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = p.nombre);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. IMÁGENES DE PRODUCTOS (SVG locales en public/seed — sin dependencias web)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO imagenes_producto (producto_id, url, orden)
SELECT id, '/seed/vaca-holstein.svg', 0 FROM productos
WHERE nombre = 'Vacas Holstein'
  AND NOT EXISTS (SELECT 1 FROM imagenes_producto WHERE url = '/seed/vaca-holstein.svg');

INSERT INTO imagenes_producto (producto_id, url, orden)
SELECT id, '/seed/cerdo-pietrain.svg', 0 FROM productos
WHERE nombre = 'Cerdos Pietrain'
  AND NOT EXISTS (SELECT 1 FROM imagenes_producto WHERE url = '/seed/cerdo-pietrain.svg');

INSERT INTO imagenes_producto (producto_id, url, orden)
SELECT id, '/seed/frutas.svg', 0 FROM productos
WHERE nombre = 'Frutas Orgánicas'
  AND NOT EXISTS (SELECT 1 FROM imagenes_producto WHERE url = '/seed/frutas.svg');

-- Recalcular cantidad por categoría según productos realmente insertados
UPDATE categorias SET cantidad = (SELECT COUNT(*) FROM productos WHERE productos.categoria_id = categorias.id);