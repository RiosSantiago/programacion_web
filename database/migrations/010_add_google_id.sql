-- =============================================================================
-- Migración 010: Autenticación con Google (Google Identity Services)
-- - Agrega google_id para vincular cuentas de Google.
--   Índice único PARCIAL: permite múltiples NULL (usuarios normales).
-- - celular pasa a nullable: los usuarios creados vía Google no tienen
--   teléfono al registrarse (la columna conserva su constraint UNIQUE,
--   y en PostgreSQL múltiples NULL sí conviven en un UNIQUE).
-- =============================================================================

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_google_id
  ON usuarios (google_id)
  WHERE google_id IS NOT NULL;

ALTER TABLE usuarios ALTER COLUMN celular DROP NOT NULL;
