-- Add 'productos' JSON column to pedidos table for storing order items snapshot
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS productos JSONB DEFAULT '[]'::jsonb;
