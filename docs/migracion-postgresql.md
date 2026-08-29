# Informe de Migración a PostgreSQL — AgroUp

**Fecha:** 2026-07-27 (actualizado post-Fase 1 completada — Bloques A, B, C y D)  
**Estado:** ✅ Fase 1 100% Completa y Verificada Localmente  
**Base de Datos Origen:** SQLite (`database/agroup.db`)  
**Base de Datos Destino:** PostgreSQL 16 (Docker Local `agroup-postgres`)

---

## 1. Resumen Ejecutivo
Se realizó la migración integral de la base de datos de AgroUp de **SQLite** a **PostgreSQL 16**. El proceso respetó estrictamente las decisiones de arquitectura de [docs/diagrama-er-actual.md](file:///c:/Users/riosv/Desktop/AgroUp%20Desarrollo/AgroUp/docs/diagrama-er-actual.md) y [docs/mapa-relaciones.md](file:///c:/Users/riosv/Desktop/AgroUp%20Desarrollo/AgroUp/docs/mapa-relaciones.md).

Todos los datos (100% de los registros) fueron migrados con **cero huérfanos**, **cero errores de restricción (FK/CHECK/UNIQUE)** y la normalización completa de las tablas 1:N (Bloques A, B, C y D).

---

## 2. Resumen de Ejecución por Bloques (Fase 1)

### 🟢 Bloque A — Normalización de Galería de Imágenes (`imagenes_producto`)
- **Acción:** Creación de la tabla `imagenes_producto (id SERIAL, producto_id FK → productos ON DELETE CASCADE, url TEXT, orden INT)`.
- **Migración de Datos:** Se extrajeron y deserializaron todos los arreglos JSON de `productos.imagenes`, migrándolos como filas individuales a `imagenes_producto`.
- **Backend:** Se creó la función `getImagenesMap` para resolver imágenes en lote con una sola consulta SQL `IN (...)`.

### 🟢 Bloque B — Normalización de Ítems de Pedidos (`detalle_pedido`)
- **Acción:** Creación de la tabla `detalle_pedido (id SERIAL, pedido_id FK → pedidos ON DELETE CASCADE, producto_id FK → productos ON DELETE RESTRICT, cantidad INT, precio_unitario NUMERIC(12,2))`.
- **Corrección de Bug Preexistente:** Se añadió la columna `pedidos.orden_id` (`VARCHAR(50) UNIQUE`) requerida por Wompi y por las referencias del backend que fallaban en SQLite.

### 🟢 Bloque C — Desvinculación y Deprecación de `productos.vendedor`
- **C1 & C2:** Limpieza de 3 registros huérfanos de prueba (`vendedor_id IS NULL`) y sincronización de 10 productos desalineados con `usuarios.nombre`.
- **C3:** Refactorización integral del código backend (`productos.ts`, `api/productos.ts`, `filtrarProductos`, `admin/productos.ts`, `mios.ts`) para resolver el nombre del vendedor dinámicamente mediante `LEFT JOIN usuarios u ON p.vendedor_id = u.id` en lugar de leer la columna de texto.
- **C4:** Ejecución de `ALTER TABLE productos DROP COLUMN vendedor;`.

### 🟢 Bloque D — Eliminación de Columnas Legacy y Limpieza Final
- **Backup Pre-DROP:** Generado `database/backup_pre_d.sql` (3.63 MB).
- **Desvinculación:** Removidas las referencias a `productos.imagenes` y `pedidos.productos` en sentencias `INSERT`, `UPDATE` y `SELECT`.
- **DROP COLUMNS:** Ejecutado `ALTER TABLE productos DROP COLUMN imagenes;` y `ALTER TABLE pedidos DROP COLUMN productos;`.
- **Verificación:** Pruebas de compilación (`npm run build`) y pruebas de flujo E2E (`test_marketplace_flows.js` y `test_d3_flows.ts`) ejecutadas limpiamente con las columnas físicamente ausentes.

---

## 3. Estado Final de Tablas y Esquema

| Tabla | Columna FK | Tabla Destino | Comportamiento ON DELETE | Estado |
| :--- | :--- | :--- | :---: | :---: |
| `productos` | `categoria_id` | `categorias(id)` | `RESTRICT` | ✅ Implementado |
| `productos` | `vendedor_id` | `usuarios(id)` | `RESTRICT` | ✅ Implementado (Borrado Lógico) |
| `imagenes_producto` | `producto_id` | `productos(id)` | `CASCADE` | ✅ Implementado |
| `pedidos` | `usuario_id` | `usuarios(id)` | `SET NULL` | ✅ Implementado |
| `detalle_pedido` | `pedido_id` | `pedidos(id)` | `CASCADE` | ✅ Implementado |
| `detalle_pedido` | `producto_id` | `productos(id)` | `RESTRICT` | ✅ Implementado |
| `vistas_vendedor` | `vendedor_id` | `usuarios(id)` | `CASCADE` | ✅ Implementado |
| `vistas_vendedor` | `viewer_id` | `usuarios(id)` | `SET NULL` | ✅ Implementado |

---

## 4. Reporte Final de Verificación de Integridad

| Tabla | Registros en SQLite | Registros en PostgreSQL | Estado |
| :--- | :---: | :---: | :---: |
| **`categorias`** | 9 | 9 | ✅ **Coincidencia 100%** |
| **`usuarios`** | 3 | 3 | ✅ **Coincidencia 100%** |
| **`productos`** | 71 | 71 | ✅ **Coincidencia 100%** |
| **`imagenes_producto`** | - | 137 | ✅ **Galería normalizada** |
| **`inventario`** | 8 | 8 | ✅ **Coincidencia 100%** |
| **`dashboard_estadisticas`** | 1 | 1 | ✅ **Coincidencia 100%** |
| **`indicadores_crecimiento`** | 12 | 12 | ✅ **Coincidencia 100%** |
| **`pedidos`** | 0 | 0 | ✅ **Limpieza completa** |
| **`detalle_pedido`** | 0 | 0 | ✅ **Estructura lista** |

- **`npm run build`:** Completo y sin errores.
- **`test_marketplace_flows.js`:** 100% verde con transacciones `BEGIN/ROLLBACK`.

---

## 5. Próximos Pasos (Fase 2: Seguridad y Autenticación)
Con la **Fase 1 (Normalización e Integridad Referencial)** completada al 100%, el proyecto está preparado para iniciar la **Fase 2**:
1. Eliminación de `usuarios.password_text` (contraseñas en texto claro).
2. Fortalecimiento de hashing de contraseñas y JWT.
3. Migración a Neon PostgreSQL Serverless (Staging/Producción).
