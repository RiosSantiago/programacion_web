-- =============================================================================
-- Migración 011: Índices para tablas de alta consulta
-- Mejora rendimiento de búsquedas/joins en marketplace, admin y flujo de pagos.
-- CREATE INDEX IF NOT EXISTS => seguro de re-ejecutar.
-- =============================================================================

-- productos
CREATE INDEX IF NOT EXISTS idx_productos_estado       ON productos (estado);
CREATE INDEX IF NOT EXISTS idx_productos_vendedor_id  ON productos (vendedor_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON productos (categoria_id);

-- imagenes_producto
CREATE INDEX IF NOT EXISTS idx_imagenes_producto_id   ON imagenes_producto (producto_id);

-- detalle_pedido
CREATE INDEX IF NOT EXISTS idx_detalle_pedido_id      ON detalle_pedido (pedido_id);
CREATE INDEX IF NOT EXISTS idx_detalle_producto_id    ON detalle_pedido (producto_id);

-- pedidos
CREATE INDEX IF NOT EXISTS idx_pedidos_estado           ON pedidos (estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario_id       ON pedidos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_orden_id         ON pedidos (orden_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_referencia_wompi ON pedidos (referencia_wompi);
