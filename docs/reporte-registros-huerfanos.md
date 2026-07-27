# Reporte de Detección de Registros Huérfanos y Discrepancias

**Fecha de ejecución:** 2026-07-26  
**Base de datos analizada:** `database/agroup.db`  
**Archivo de definición del esquema:** [db.ts](file:///c:/Users/riosv/Desktop/AgroUp%20Desarrollo/AgroUp/src/lib/db.ts)

---

## 1. Resumen Ejecutivo

Se realizó una auditoría completa de la base de datos SQLite actual del proyecto para identificar:
1. Registros con claves foráneas (FK) declaradas o implícitas apuntando a registros padres inexistentes.
2. Desalineaciones de datos entre referencias de texto e identificadores.

### Resultado de la Auditoría Tabla por Tabla

| Tabla | Registros Totales | Clave Foránea / Referencia Evaluada | Registros Huérfanos / Desalineados | Estado |
| :--- | :---: | :--- | :---: | :--- |
| `usuarios` | 3 | N/A (Tabla Padre) | 0 | Sin huérfanos |
| `categorias` | 9 | N/A (Tabla Padre) | 0 | Sin huérfanos |
| `productos` | 71 | `vendedor_id` ➔ `usuarios(id)` | 0 | Sin huérfanos (10 en usuario 2, 61 en usuario 7) |
| `productos` | 71 | `categoria` (implícita) ➔ `categorias(nombre)` | **71** | **71/71 desalineados** (`'bovino'` vs `'Bovinos'`) |
| `pedidos` | 0 | `usuario_id` ➔ `usuarios(id)` | 0 | Tabla vacía |
| `vistas_vendedor` | 0 | `vendedor_id` ➔ `usuarios(id)`, `viewer_id` ➔ `usuarios(id)` | 0 | Tabla vacía |
| `inventario` | 8 | N/A | 0 | Independiente |
| `dashboard_estadisticas` | 1 | N/A | 0 | Independiente |
| `indicadores_crecimiento` | 12 | N/A | 0 | Independiente |
| `favoritos` | N/A | N/A | N/A | No existe en SQLite (se almacena en `localStorage`) |

---

## 2. Detalle de Registros Afectados

### A. Relación `productos.vendedor_id` ➔ `usuarios.id`
- **Total de registros evaluados:** 71
- **Huérfanos detectados:** 0
- **Distribución:**
  - `vendedor_id = 2` ("Juan Esteban Arcila"): 10 productos (IDs 36-45)
  - `vendedor_id = 7` ("Santiago Rios Valencia"): 61 productos (IDs 46-106)
  - `vendedor_id` NULO o inexistente: 0

### B. Relación Implícita `productos.categoria` ➔ `categorias.nombre`
- **Total de registros evaluados:** 71
- **Discrepancias detectadas:** 71 productos (100% de la tabla)
- **Causa raíz:** En la tabla `categorias` los nombres están almacenados en **plural con inicial mayúscula** (`'Bovinos'`, `'Equinos'`, `'Porcinos'`, `'Ovinos'`, `'Avicolas'`), mientras que en la tabla `productos` se insertaron como **slugs en minúscula y singular** (`'bovino'`, `'equino'`, `'porcino'`, `'ovino'`, `'avicola'`).

#### Desglose de Valores en `productos.categoria`:
1. **`bovino` (21 productos):** IDs 36, 37, 46, 47, 52, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71  
   *Categoría padre en `categorias`:* `'Bovinos'` (ID 1)
2. **`porcino` (14 productos):** IDs 43, 44, 49, 54, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81  
   *Categoría padre en `categorias`:* `'Porcinos'` (ID 3)
5. **`ovino` (12 productos):** IDs 42, 50, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91  
   *Categoría padre en `categorias`:* `'Ovinos'` (ID 9, ajustado desde 459)

---

## 3. Opciones de Normalización / Corrección Propuestas

- **Opción B (Implementada y Seleccionada):**  
  Añadir una columna `categoria_id INTEGER REFERENCES categorias(id)` en `productos` y poblarla con el ID entero correspondiente de la tabla `categorias`.

---

## 4. Estado de Ejecución de la Limpieza (Opción B + Corrección ID Ovinos Completada)

- **Copias de Respaldo Creadas:** `database/agroup.db.bak` y `database/agroup.db.bak_fix459`
- **Columna Creada:** `productos.categoria_id INTEGER REFERENCES categorias(id)`
- **Registros Poblados:** 71 de 71 productos mapeados a sus respectivos `categorias.id`:
  - `Bovinos`: ID 1 (21 productos)
  - `Equinos`: ID 2 (13 productos)
  - `Porcinos`: ID 3 (14 productos)
  - `Avicolas`: ID 4 (11 productos)
  - `Ovinos`: ID 9 (12 productos)
- **Nota del Ajuste del ID 459 ➔ 9 en Ovinos:**
  * **Hallazgo:** Inicialmente `Ovinos` figuraba con `id = 459` debido a que la tabla interna de secuencias de SQLite (`sqlite_sequence`) contenía un contador residual `seq = 729` generado por pruebas/semillas previas.
  * **Corrección Realizada:** Se actualizó `categorias.id = 9`, los 12 productos de ovinos a `categoria_id = 9`, y la secuencia `sqlite_sequence` a `seq = 9`, dejando la tabla `categorias` con identificadores limpios y correlativos del 1 al 9.
- **Resultado de la Re-Auditoría:** **0 registros nulos, 0 registros huérfanos, 0 referencias residuales a 459.**

---

## 5. Entregables Generados

1. **[docs/reporte-registros-huerfanos.md](file:///c:/Users/riosv/Desktop/AgroUp%20Desarrollo/AgroUp/docs/reporte-registros-huerfanos.md):** Reporte de desalineación y confirmación de limpieza.
2. **[docs/diagrama-er-actual.md](file:///c:/Users/riosv/Desktop/AgroUp%20Desarrollo/AgroUp/docs/diagrama-er-actual.md):** Diagrama Entidad-Relación oficial en sintaxis Mermaid.

