# Mapa de Relaciones del Esquema

**Fecha de actualización:** 2026-07-27  
**Base de datos analizada:** PostgreSQL 16 (`agroup` en Docker / Neon)  
**Definición de código:** [db.ts](file:///c:/Users/riosv/Desktop/AgroUp%20Desarrollo/AgroUp/src/lib/db.ts) y modelos en [src/lib/models/](file:///c:/Users/riosv/Desktop/AgroUp%20Desarrollo/AgroUp/src/lib/models/)

Este documento detalla todas las relaciones del esquema de AgroUp tras la finalización completa de la Fase 1 (Bloques A, B, C y D).

---

## 📊 Tabla General de Relaciones

| Tabla Origen | Columna (FK / Ref) | Tabla y Columna Destino | Cardinalidad | ¿Está declarada en el esquema SQL? | Comportamiento `ON DELETE` Implementado | Justificación del Negocio |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `productos` | `categoria_id` | `categorias(id)` | **1:N** | **Sí** | **`RESTRICT`** | Bloquea borrar una categoría si tiene productos activos en el marketplace. |
| `productos` | `vendedor_id` | `usuarios(id)` | **1:N** | **Sí** | **`RESTRICT`** | Preserva productos para borrado lógico (`estado = 'inactivo'`) e integridad en pedidos históricos. |
| `imagenes_producto` | `producto_id` | `productos(id)` | **1:N** | **Sí** | **`CASCADE`** | Normalización de galería (Bloque A). Si un producto se elimina, sus imágenes asociadas se eliminan en cascada. |
| `pedidos` | `usuario_id` | `usuarios(id)` | **1:N** | **Sí** | **`SET NULL`** | Preserva historial contable/fiscal si el comprador se da de baja. |
| `detalle_pedido` | `pedido_id` | `pedidos(id)` | **1:N** | **Sí** | **`CASCADE`** | Normalización de ítems (Bloque B). Si un pedido se elimina, sus líneas de detalle se eliminan en cascada. |
| `detalle_pedido` | `producto_id` | `productos(id)` | **1:N** | **Sí** | **`RESTRICT`** | Impide eliminar un producto si ya forma parte de un pedido histórico. |
| `vistas_vendedor` | `vendedor_id` | `usuarios(id)` | **1:N** | **Sí** | **`CASCADE`** | Las métricas de visualización pertenecen al perfil del vendedor. |
| `vistas_vendedor` | `viewer_id` | `usuarios(id)` | **1:N** | **Sí** | **`SET NULL`** | Conserva métrica anónimamente si el visitante borra su cuenta. |

---

## 🔍 Análisis Detallado por Relación

### 1. FKs Declaradas Formalmente en SQL (Fase 1 Completada)

#### `imagenes_producto.producto_id ➔ productos(id)` (Bloque A)
- `ON DELETE CASCADE`: Galería de imágenes normalizada en tabla 1:N. Elimina automáticamente todas las fotos vinculadas al eliminar el producto.

#### `detalle_pedido.pedido_id ➔ pedidos(id)` y `detalle_pedido.producto_id ➔ productos(id)` (Bloque B)
- `pedido_id ON DELETE CASCADE`: Si se elimina la orden de compra, sus ítems de detalle se borran.
- `producto_id ON DELETE RESTRICT`: Impide la eliminación accidental de productos con histórico de ventas.

#### `productos.vendedor_id ➔ usuarios(id)` (Bloque C)
- `ON DELETE RESTRICT`: El nombre del vendedor se resuelve directamente mediante JOIN `usuarios.nombre` via `vendedor_id`. La columna de texto redundante `productos.vendedor` fue eliminada de la base de datos (Bloque C4).

---

## 📁 Archivos Relacionados
- **Diagrama ER Mermaid:** [docs/diagrama-er-actual.md](file:///c:/Users/riosv/Desktop/AgroUp%20Desarrollo/AgroUp/docs/diagrama-er-actual.md)
- **Documentación de Migración PostgreSQL:** [docs/migracion-postgresql.md](file:///c:/Users/riosv/Desktop/AgroUp%20Desarrollo/AgroUp/docs/migracion-postgresql.md)
s/diagrama-er-actual.md](file:///c:/Users/riosv/Desktop/AgroUp%20Desarrollo/AgroUp/docs/diagrama-er-actual.md)
