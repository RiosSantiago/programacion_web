-- =============================================================================
-- MIGRACIÓN 002: COLUMNA ica_pdf EN productos
-- Agrega el campo para almacenar el certificado ICA/sanitario del animal
-- =============================================================================

ALTER TABLE productos ADD COLUMN IF NOT EXISTS ica_pdf TEXT DEFAULT '';
