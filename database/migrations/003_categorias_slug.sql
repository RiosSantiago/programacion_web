-- =============================================================================
-- 003_categorias_slug.sql
-- Agrega la columna slug a categorias y la puebla desde nombre.
-- La columna ya estaba en schema.pg.sql, pero CREATE TABLE IF NOT EXISTS no
-- altera tablas existentes, por lo que las BDs creadas antes no la tenían.
-- =============================================================================

ALTER TABLE categorias ADD COLUMN IF NOT EXISTS slug VARCHAR(100) NOT NULL DEFAULT '';

UPDATE categorias
SET slug = REGEXP_REPLACE(
    REGEXP_REPLACE(
        TRANSLATE(LOWER(nombre), 'áéíóúüñ', 'aeiouun'),
        '\s+', '-', 'g'
    ),
    '[^a-z0-9-]', '', 'g'
)
WHERE slug = '' OR slug IS NULL;
