-- Migración 007: Asegurar compatibilidad entre ica_pdf y certificaciones en la tabla productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS certificaciones TEXT DEFAULT '';

-- Sincronizar datos existentes entre ambas columnas
UPDATE productos
SET certificaciones = ica_pdf
WHERE (certificaciones IS NULL OR certificaciones = '') AND ica_pdf IS NOT NULL AND ica_pdf != '';

UPDATE productos
SET ica_pdf = certificaciones
WHERE (ica_pdf IS NULL OR ica_pdf = '') AND certificaciones IS NOT NULL AND certificaciones != '';
