-- =============================================================================
-- MIGRACIÓN 003: COLUMNA transporte EN productos
-- Agrega el campo para indicar el tipo de transporte de la publicación:
--   'agroup' = Transporte por medio de AgroUp
--   'propio' = Transporte por medios propios
-- =============================================================================

ALTER TABLE productos ADD COLUMN IF NOT EXISTS transporte VARCHAR(50) DEFAULT 'propio';
