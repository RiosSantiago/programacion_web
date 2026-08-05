-- =============================================================================
-- ESQUEMA OFICIAL DE POSTGRESQL PARA AGROUP
-- Basado estrictamente en docs/diagrama-er-actual.md y docs/mapa-relaciones.md
-- =============================================================================

-- 1. TABLA CATEGORIAS
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE DEFAULT '',
    icono VARCHAR(50) NOT NULL,
    color VARCHAR(100) NOT NULL,
    cantidad INTEGER DEFAULT 0
);

-- 2. TABLA USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    celular VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    verificado BOOLEAN DEFAULT false,
    rol VARCHAR(50) DEFAULT 'comprador' CHECK (rol IN ('root', 'admin', 'vendedor', 'comprador')),
    avatar TEXT,
    password_text VARCHAR(255) DEFAULT '', -- TEMPORAL: eliminar en Fase 2 — vulnerabilidad de contraseña en texto plano, ver diagnóstico de seguridad
    hacienda VARCHAR(255) DEFAULT '',
    ciudad VARCHAR(255) DEFAULT '',
    direccion TEXT DEFAULT '',
    municipio VARCHAR(255) DEFAULT '',
    corregimiento VARCHAR(255) DEFAULT '',
    reset_token VARCHAR(255) DEFAULT '',
    reset_token_exp BIGINT DEFAULT 0,
    departamento VARCHAR(255) DEFAULT '',
    whatsapp VARCHAR(50) DEFAULT '',
    descripcion TEXT DEFAULT '',
    especies TEXT DEFAULT '[]',
    logo TEXT DEFAULT '',
    portada TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL, -- Columna legacy de texto
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE RESTRICT,
    raza VARCHAR(100),
    peso NUMERIC(10, 2),
    peso_unitario NUMERIC(10, 2),
    ubicacion VARCHAR(255) NOT NULL,
    departamento VARCHAR(255) NOT NULL,
    precio NUMERIC(12, 2) NOT NULL,
    precio_anterior NUMERIC(12, 2),
    stock INTEGER NOT NULL,
    vendedor_id INTEGER REFERENCES usuarios(id) ON DELETE RESTRICT, -- ON DELETE RESTRICT por regla de borrado lógico
    vendedor_rating NUMERIC(3, 2),
    estado VARCHAR(50) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'inactivo', 'vendido')),
    salud VARCHAR(50) DEFAULT 'Bueno' CHECK (salud IN ('Excelente', 'Bueno', 'Regular', 'Malo')),
    envio BOOLEAN DEFAULT false,
    destacado BOOLEAN DEFAULT false,
    oferta BOOLEAN DEFAULT false,
    trazabilidad BOOLEAN DEFAULT false,
    tipo_precio VARCHAR(50) DEFAULT 'fijo' CHECK (tipo_precio IN ('fijo', 'negociable', 'subasta')),
    sexo VARCHAR(20) CHECK (sexo IS NULL OR sexo IN ('macho', 'hembra', 'mixto')),
    fecha_nacimiento VARCHAR(50) DEFAULT '',
    descripcion TEXT DEFAULT '',
    video TEXT DEFAULT '',
    finca VARCHAR(255) DEFAULT '',
    vereda VARCHAR(255) DEFAULT '',
    referencia_ubicacion TEXT DEFAULT '',
    certificaciones TEXT DEFAULT '',
    transporte VARCHAR(50) DEFAULT 'propio',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA INVENTARIO
CREATE TABLE IF NOT EXISTS inventario (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    raza VARCHAR(100) NOT NULL,
    edad VARCHAR(50) NOT NULL,
    peso NUMERIC(10, 2) NOT NULL,
    ubicacion VARCHAR(255) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    ultimo_check TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLA DASHBOARD ESTADISTICAS
CREATE TABLE IF NOT EXISTS dashboard_estadisticas (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    total_cabezas INTEGER DEFAULT 0,
    alertas_salud INTEGER DEFAULT 0,
    promedio_peso NUMERIC(10, 2) DEFAULT 0,
    crecimiento_mensual NUMERIC(5, 2) DEFAULT 0,
    rendimiento_promedio NUMERIC(5, 2) DEFAULT 0,
    produccion_leche INTEGER DEFAULT 0
);

-- 6. TABLA INDICADORES CRECIMIENTO
CREATE TABLE IF NOT EXISTS indicadores_crecimiento (
    id SERIAL PRIMARY KEY,
    mes VARCHAR(50) NOT NULL,
    peso NUMERIC(10, 2) NOT NULL,
    produccion INTEGER NOT NULL
);

-- 7. TABLA PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    total NUMERIC(12, 2) NOT NULL,
    metodo_pago VARCHAR(50) DEFAULT 'whatsapp',
    estado VARCHAR(50) DEFAULT 'pendiente',
    referencia_wompi VARCHAR(255),
    orden_id VARCHAR(50) DEFAULT '',
    nombre_comprador VARCHAR(255),
    telefono_comprador VARCHAR(50),
    direccion TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. TABLA VISTAS VENDEDOR
CREATE TABLE IF NOT EXISTS vistas_vendedor (
    id SERIAL PRIMARY KEY,
    vendedor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    viewer_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    viewer_ip VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. TABLA IMAGENES PRODUCTO
CREATE TABLE IF NOT EXISTS imagenes_producto (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    orden INTEGER DEFAULT 0
);

-- 10. TABLA DETALLE PEDIDO
CREATE TABLE IF NOT EXISTS detalle_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12, 2) NOT NULL
);

-- 11. TABLA FAVORITOS
CREATE TABLE IF NOT EXISTS favoritos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    fecha_agregado TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, producto_id)
);

-- 12. TABLA CARRITO
CREATE TABLE IF NOT EXISTS carrito (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INTEGER DEFAULT 1 CHECK (cantidad > 0),
    fecha_agregado TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, producto_id)
);


