-- =============================================================================
-- MIGRACIÓN 001: FAVORITOS Y CARRITO
-- Creada: 2026-07-28
-- =============================================================================

-- 1. TABLA FAVORITOS
CREATE TABLE IF NOT EXISTS favoritos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    fecha_agregado TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, producto_id)
);

-- 2. TABLA CARRITO
CREATE TABLE IF NOT EXISTS carrito (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INTEGER DEFAULT 1 CHECK (cantidad > 0),
    fecha_agregado TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, producto_id)
);
