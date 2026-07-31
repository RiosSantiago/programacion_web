-- =============================================================================
-- 004_quitar_descuentos_agricultura.sql
-- Quita descuentos y ofertas (cosas rojas) de los productos de agricultura.
-- Deja null precio_anterior y oferta en false para que no se rendericen
-- badges rojos ni precios tachados en esa categoría.
-- =============================================================================

UPDATE productos
SET precio_anterior = NULL,
    oferta = false
WHERE categoria_id IN (SELECT id FROM categorias WHERE LOWER(slug) = 'agricultura')
   OR LOWER(categoria) = 'agricultura';
