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
-- 3. PRODUCTOS DE PRUEBA (definidos para las pruebas oficiales del informe §3)
--    P1 Estándar/Completo · P2 Mínimo · P3 Especial/Complejo
--
-- NOTAS SOBRE CONSTRAINTS DE database/schema.pg.sql:
--   * estado     CHECK solo admite ('disponible','inactivo','vendido')  -> P3 va
--               'disponible' con oferta=true (etiqueta "En oferta limitada").
--               El estado 'en_subasta' NO existe en el modelo actual.
--   * tipo_precio CHECK solo admite ('fijo','negociable','subasta')     -> P3 va
--               'negociable' (precio por kg). 'variable' NO existe.
--   * sexo      CHECK (NULL | macho | hembra | mixto)                   -> P3: NULL.
--   * salud     CHECK ('Excelente','Bueno','Regular','Malo').
--   * No existe columna 'vacunas': la documentación de vacunas se guarda en
--     'certificaciones' (TEXT) y el número de certificado en 'ica_pdf'.
--   * ubicacion y departamento son NOT NULL (los 3 productos los traen).
--   * VARCHAR(50) en departamento NO impone lista de 32 departamentos.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO productos (
  vendedor_id, nombre, descripcion, categoria, categoria_id,
  precio, precio_unitario, stock, peso, ubicacion, departamento,
  raza, sexo, estado, salud, tipo_precio, envio, destacado, oferta,
  trazabilidad, finca, certificaciones, ica_pdf
)
SELECT
  (SELECT id FROM usuarios WHERE email = 'vendedor@test.local'),
  p.nombre, p.descripcion, p.categoria,
  (SELECT id FROM categorias WHERE slug = p.categoria),
  p.precio, p.precio_unitario, p.stock, p.peso, p.ubicacion, p.departamento,
  p.raza, p.sexo, p.estado, p.salud, p.tipo_precio, p.envio, p.destacado,
  p.oferta, p.trazabilidad, p.finca, p.certificaciones, p.ica_pdf
FROM (VALUES
  (
    'Vaca Holstein raza pura para producción lechera',
    'Vaca Holstein certificada, 4 años, 650kg. Línea genética pura importada de Holanda. Vacunada contra brucelosis y tuberculosis. Libre de enfermedades. Documentación veterinaria completa. Ubicación: Finca "La Esperanza", Caldas.',
    'bovinos',
    50000000::numeric, 50000000::numeric, 3, 650::numeric,
    'Finca La Esperanza', 'Caldas',
    'Holstein', 'hembra', 'disponible', 'Excelente', 'fijo',
    false, true, false, true,
    'La Esperanza',
    'Vacunas: Brucelosis, Tuberculosis, Fiebre Aftosa',
    'ICA-2026-001234'
  ),
  (
    'Cerdo joven',
    'Cerdo en buen estado',
    'porcinos',
    2000000::numeric, 2000000::numeric, 1, NULL::numeric,
    'Dosquebradas', 'Risaralda',
    'Pietrain', 'macho', 'disponible', 'Bueno', 'fijo',
    false, false, false, false,
    '', '', ''
  ),
  (
    'Lote de frutas varias x 500kg (manzanas, peras, naranjas)',
    'Lote mixto de frutas de temporada. Cosecha 2026-10-15. Cultivo orgánico sin pesticidas. Disponible para compra por cantidad o lote completo. Frutas de alta calidad, directas de la finca. Entrega en 24h.',
    'agricultura',
    50000::numeric, 100::numeric, 500, 500::numeric,
    'Manizales', 'Caldas',
    'Mixtas (manzana, pera, naranja)', NULL, 'disponible', 'Excelente', 'negociable',
    true, false, true, true,
    '',
    'Cultivo orgánico certificado',
    ''
  )
) AS p(nombre, descripcion, categoria, precio, precio_unitario, stock, peso,
       ubicacion, departamento, raza, sexo, estado, salud, tipo_precio, envio,
       destacado, oferta, trazabilidad, finca, certificaciones, ica_pdf)
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = p.nombre);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. IMÁGENES DE PRODUCTOS (SVG locales en public/seed — sin dependencias web)
--    P1 (3): vaca · certificado ICA · ubicación/predio
--    P2 (1): solo el animal
--    P3 (4): frutas en árbol · cosecha · empaque · transporte
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO imagenes_producto (producto_id, url, orden)
SELECT id, '/seed/vaca-holstein.svg',    0 FROM productos
WHERE nombre = 'Vaca Holstein raza pura para producción lechera'
  AND NOT EXISTS (SELECT 1 FROM imagenes_producto WHERE url = '/seed/vaca-holstein.svg');

INSERT INTO imagenes_producto (producto_id, url, orden)
SELECT id, '/seed/certificado-ica.svg',  1 FROM productos
WHERE nombre = 'Vaca Holstein raza pura para producción lechera'
  AND NOT EXISTS (SELECT 1 FROM imagenes_producto WHERE url = '/seed/certificado-ica.svg');

INSERT INTO imagenes_producto (producto_id, url, orden)
SELECT id, '/seed/predio.svg',           2 FROM productos
WHERE nombre = 'Vaca Holstein raza pura para producción lechera'
  AND NOT EXISTS (SELECT 1 FROM imagenes_producto WHERE url = '/seed/predio.svg');

INSERT INTO imagenes_producto (producto_id, url, orden)
SELECT id, '/seed/cerdo-pietrain.svg',   0 FROM productos
WHERE nombre = 'Cerdo joven'
  AND NOT EXISTS (SELECT 1 FROM imagenes_producto WHERE url = '/seed/cerdo-pietrain.svg');

INSERT INTO imagenes_producto (producto_id, url, orden)
SELECT id, '/seed/frutas.svg',           0 FROM productos
WHERE nombre = 'Lote de frutas varias x 500kg (manzanas, peras, naranjas)'
  AND NOT EXISTS (SELECT 1 FROM imagenes_producto WHERE url = '/seed/frutas.svg');

INSERT INTO imagenes_producto (producto_id, url, orden)
SELECT id, '/seed/frutas-cosecha.svg',   1 FROM productos
WHERE nombre = 'Lote de frutas varias x 500kg (manzanas, peras, naranjas)'
  AND NOT EXISTS (SELECT 1 FROM imagenes_producto WHERE url = '/seed/frutas-cosecha.svg');

INSERT INTO imagenes_producto (producto_id, url, orden)
SELECT id, '/seed/frutas-empaque.svg',   2 FROM productos
WHERE nombre = 'Lote de frutas varias x 500kg (manzanas, peras, naranjas)'
  AND NOT EXISTS (SELECT 1 FROM imagenes_producto WHERE url = '/seed/frutas-empaque.svg');

INSERT INTO imagenes_producto (producto_id, url, orden)
SELECT id, '/seed/frutas-transporte.svg',3 FROM productos
WHERE nombre = 'Lote de frutas varias x 500kg (manzanas, peras, naranjas)'
  AND NOT EXISTS (SELECT 1 FROM imagenes_producto WHERE url = '/seed/frutas-transporte.svg');

-- Recalcular cantidad por categoría según productos realmente insertados
UPDATE categorias SET cantidad = (SELECT COUNT(*) FROM productos WHERE productos.categoria_id = categorias.id);