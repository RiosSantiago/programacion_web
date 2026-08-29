-- =============================================================================
-- Migración 008: Eliminar columna password_text de la tabla usuarios
-- Resuelve la vulnerabilidad de persistencia de contraseñas en texto claro.
-- La autenticación y almacenamiento ahora se gestiona con bcrypt + JWT firmado.
-- =============================================================================

ALTER TABLE usuarios DROP COLUMN IF EXISTS password_text;
