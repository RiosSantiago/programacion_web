# Diagrama Entidad-Relación (ER) - Esquema Actual

**Base de datos de referencia:** PostgreSQL 16 (`agroup` — Docker local / Neon en staging)  
**Última actualización:** 2026-07-27 — Refleja el esquema final post-Bloque D (migración 100% completada). Se removieron las columnas legacy (`productos.vendedor`, `productos.imagenes`, `pedidos.productos`) y se formalizaron las tablas `imagenes_producto` y `detalle_pedido` como relaciones FK relacionales directas.

```mermaid
erDiagram

    usuarios {
        INTEGER id PK
        TEXT email
        TEXT celular
        TEXT nombre
        TEXT password_hash
        INTEGER verificado
        TEXT rol
        TEXT avatar
        DATETIME created_at
        TEXT password_text
        TEXT hacienda
        TEXT ciudad
        TEXT direccion
        TEXT municipio
        TEXT corregimiento
        TEXT reset_token
        INTEGER reset_token_exp
        TEXT departamento
        TEXT whatsapp
        TEXT descripcion
        TEXT especies
        TEXT logo
        TEXT portada
    }

    categorias {
        INTEGER id PK
        TEXT nombre
        TEXT icono
        TEXT color
        INTEGER cantidad
    }

    productos {
        INTEGER id PK
        TEXT nombre
        TEXT categoria
        INTEGER categoria_id FK
        TEXT raza
        REAL peso
        REAL peso_unitario
        TEXT ubicacion
        TEXT departamento
        REAL precio
        REAL precio_anterior
        INTEGER stock
        INTEGER vendedor_id FK
        REAL vendedor_rating
        TEXT estado
        TEXT salud
        INTEGER envio
        INTEGER destacado
        INTEGER oferta
        INTEGER trazabilidad
        TEXT tipo_precio
        TEXT sexo
        TEXT fecha_nacimiento
        TEXT descripcion
        TEXT video
        TEXT finca
        TEXT vereda
        TEXT referencia_ubicacion
        DATETIME created_at
    }

    imagenes_producto {
        INTEGER id PK
        INTEGER producto_id FK
        TEXT url
        INTEGER orden
    }

    pedidos {
        INTEGER id PK
        TEXT orden_id UK "AG-AAMMDD-NNNN — ID legible de cara al cliente y a Wompi"
        INTEGER usuario_id FK
        REAL total
        TEXT metodo_pago
        TEXT estado
        TEXT referencia_wompi "UUID del payment_link de Wompi"
        TEXT nombre_comprador
        TEXT telefono_comprador
        TEXT direccion
        TEXT notas
        DATETIME created_at
    }

    detalle_pedido {
        INTEGER id PK
        INTEGER pedido_id FK
        INTEGER producto_id FK
        INTEGER cantidad
        REAL precio_unitario
    }

    vistas_vendedor {
        INTEGER id PK
        INTEGER vendedor_id FK
        INTEGER viewer_id FK
        TEXT viewer_ip
        DATETIME created_at
    }

    inventario {
        INTEGER id PK
        TEXT codigo
        TEXT nombre
        TEXT raza
        TEXT edad
        REAL peso
        TEXT ubicacion
        TEXT estado
        DATETIME ultimo_check
        DATETIME created_at
    }

    dashboard_estadisticas {
        INTEGER id PK
        INTEGER total_cabezas
        INTEGER alertas_salud
        REAL promedio_peso
        REAL crecimiento_mensual
        REAL rendimiento_promedio
        INTEGER produccion_leche
    }

    indicadores_crecimiento {
        INTEGER id PK
        TEXT mes
        REAL peso
        INTEGER produccion
    }

    %% RELACIONES
    usuarios ||--o{ productos : "publica (vendedor_id)"
    categorias ||--o{ productos : "clasifica (categoria_id)"
    productos ||--o{ imagenes_producto : "posee (producto_id)"
    usuarios ||--o{ pedidos : "realiza (usuario_id)"
    pedidos ||--o{ detalle_pedido : "contiene (pedido_id)"
    productos ||--o{ detalle_pedido : "es_vendido_en (producto_id)"
    usuarios ||--o{ vistas_vendedor : "posee_vistas (vendedor_id)"
    usuarios ||--o{ vistas_vendedor : "visita (viewer_id)"
```

## Leyenda y Notas del Diagrama ER

- **Líneas Continuas (`||--o{`):** Relaciones relacionales con FK formalmente declaradas e implementadas con constraints en PostgreSQL (`imagenes_producto.producto_id ON DELETE CASCADE`, `detalle_pedido.pedido_id ON DELETE CASCADE`, `detalle_pedido.producto_id ON DELETE RESTRICT`).
- **Normalización de Tablas 1:N (Bloques A, B, C, D):** Las columnas legacy con JSON empaquetado (`productos.imagenes` y `pedidos.productos`) y la redundancia `productos.vendedor` fueron eliminadas de forma segura de la base de datos tras verificar la desvinculación completa en el código.
- **`ON DELETE` en `productos.vendedor_id`:** Se mantiene `RESTRICT` + borrado lógico (`estado = 'inactivo'`) para preservar integridad referencial con los registros históricos en `detalle_pedido`.
- **`pedidos.orden_id` — Bug preexistente resuelto en migración:** Identificador legible de pedido (`AG-AAMMDD-NNNN`) usado como referencia en transacciones de Wompi. Ver [Hallazgo #5 en migracion-postgresql.md](file:///c:/Users/riosv/Desktop/AgroUp%20Desarrollo/AgroUp/docs/migracion-postgresql.md).

