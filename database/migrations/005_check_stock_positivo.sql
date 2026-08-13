-- Migración 005: Agregar constraint para garantizar que el stock sea siempre >= 0
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'chk_stock_positivo'
    ) THEN
        ALTER TABLE productos ADD CONSTRAINT chk_stock_positivo CHECK (stock >= 0);
    END IF;
END $$;
