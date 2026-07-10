const Database = require('better-sqlite3');

const srcDb = new Database('C:/Users/riosv/OneDrive/Escritorio/Agrotech-temp/database/agrotech.db', { readonly: true });
const destDb = new Database('C:/Users/riosv/OneDrive/Escritorio/Agrotech-main/database/agrotech.db');

// Asegurar que las columnas necesarias existen
const alteraciones = [
  "ALTER TABLE productos ADD COLUMN vendedor_id INTEGER",
  "ALTER TABLE productos ADD COLUMN tipo_precio TEXT DEFAULT 'fijo'",
  "ALTER TABLE productos ADD COLUMN sexo TEXT DEFAULT ''",
  "ALTER TABLE productos ADD COLUMN fecha_nacimiento TEXT DEFAULT ''",
  "ALTER TABLE productos ADD COLUMN video TEXT DEFAULT ''",
  "ALTER TABLE productos ADD COLUMN descripcion TEXT DEFAULT ''",
];
for (const sql of alteraciones) {
  try { destDb.exec(sql); } catch {}
}

// Obtener productos nuevos del repo de los compañeros (IDs >= 30)
const productosNuevos = srcDb.prepare('SELECT * FROM productos WHERE id >= 30').all();
console.log(`Productos a insertar: ${productosNuevos.length}`);

const insert = destDb.prepare(`
  INSERT OR REPLACE INTO productos (
    id, nombre, categoria, raza, peso, peso_unitario, ubicacion, departamento,
    precio, precio_anterior, stock, vendedor_id, vendedor, vendedor_rating,
    imagenes, estado, salud, envio, destacado, oferta, trazabilidad, descripcion,
    created_at, tipo_precio, sexo, fecha_nacimiento, video
  ) VALUES (
    @id, @nombre, @categoria, @raza, @peso, @peso_unitario, @ubicacion, @departamento,
    @precio, @precio_anterior, @stock, @vendedor_id, @vendedor, @vendedor_rating,
    @imagenes, @estado, @salud, @envio, @destacado, @oferta, @trazabilidad, @descripcion,
    @created_at, @tipo_precio, @sexo, @fecha_nacimiento, @video
  )
`);

const insertMany = destDb.transaction((productos) => {
  for (const p of productos) {
    insert.run(p);
    console.log(`✅ Insertado: [${p.id}] ${p.nombre}`);
  }
});

insertMany(productosNuevos);

// Verificar resultado
const total = destDb.prepare('SELECT COUNT(*) as total FROM productos').get();
console.log(`\n✅ Total productos en la BD: ${total.total}`);

srcDb.close();
destDb.close();
