-- Migración 006: Agregar columna precio_unitario a la tabla productos
-- Calcula precio_unitario = precio / stock para lotes existentes y precio para individuales.

ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_unitario NUMERIC(12, 2);

-- Actualizar productos existentes donde stock > 1 (lotes)
UPDATE productos
SET precio_unitario = ROUND(precio / stock, 2)
WHERE stock > 1 AND (precio_unitario IS NULL OR precio_unitario = 0);

-- Actualizar productos existentes con stock <= 1 (individuales)
UPDATE productos
SET precio_unitario = precio
WHERE (stock IS NULL OR stock <= 1) AND (precio_unitario IS NULL OR precio_unitario = 0);
