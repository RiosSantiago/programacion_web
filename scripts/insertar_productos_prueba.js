/**
 * Script para insertar 10 productos agrícolas de prueba (café, aguacate, cacao)
 * Asignados al usuario jespitia1921@gmail.com
 * Descarga imágenes reales desde Unsplash, las procesa via sharp (WebP)
 * y las guarda en public/uploads/animales/ (como el upload endpoint).
 *
 * Uso: node scripts/insertar_productos_prueba.js
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { cwd } from 'process';

const { Client } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(cwd(), 'public', 'uploads', 'agricultura');
const EMAIL = 'jespitia1921@gmail.com';
const CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5433/agroup';

const IMAGES = [
  { filename: 'cafe-organico',       url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80' },
  { filename: 'cafe-gesha',          url: 'https://images.unsplash.com/photo-1654789288290-168345b2ed2b?w=800&q=80' },
  { filename: 'cafe-pergamino',      url: 'https://images.unsplash.com/photo-1767399601163-d2ee575262c4?w=800&q=80' },
  { filename: 'cafe-tostado',        url: 'https://images.unsplash.com/photo-1515471897120-85416077e011?w=800&q=80' },
  { filename: 'aguacate-hass',       url: 'https://images.unsplash.com/photo-1726177551991-270f9e79b65e?w=800&q=80' },
  { filename: 'aguacate-papelillo',  url: 'https://images.unsplash.com/photo-1681567846249-5b1066dbf5f2?w=800&q=80' },
  { filename: 'aguacate-lorena',     url: 'https://images.unsplash.com/photo-1760108273034-f8f7e2889913?w=800&q=80' },
  { filename: 'cacao-fermentado',    url: 'https://images.unsplash.com/photo-1705542116578-b6e7972479f1?w=800&q=80' },
  { filename: 'cacao-grano',         url: 'https://images.unsplash.com/photo-1757466687609-0bdaca5578fc?w=800&q=80' },
  { filename: 'cacao-polvo',         url: 'https://images.unsplash.com/photo-1507576164121-220762647800?w=800&q=80' },
];

function generateUploadName(baseName) {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}-${rand}.webp`;
}

async function downloadAndProcessImage(baseName, url) {
  const webpFilename = generateUploadName(baseName);
  const filepath = path.join(UPLOAD_DIR, webpFilename);

  console.log(`  ↓ Descargando ${baseName}...`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} para ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());

  console.log(`  → Convirtiendo a WebP...`);
  const webpBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
  fs.writeFileSync(filepath, webpBuffer);

  console.log(`  ✔ ${webpFilename} guardado (${(webpBuffer.length / 1024).toFixed(0)} KB)`);
  return `/uploads/agricultura/${webpFilename}`;
}

async function queryGet(client, text, params = []) {
  const res = await client.query(text, params);
  return res.rows[0];
}

async function main() {
  console.log('=== Insertando 10 productos agrícolas de prueba ===\n');

  // 0. Asegurar directorio uploads
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`✔ Directorio ${UPLOAD_DIR} listo\n`);

  // Descargar y procesar imágenes
  console.log('--- Descargando y procesando imágenes ---');
  const imageRoutes = [];
  for (const img of IMAGES) {
    const route = await downloadAndProcessImage(img.filename, img.url);
    imageRoutes.push(route);
  }
  console.log('');

  // Conectar a DB
  const client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();
  console.log('✔ Conectado a PostgreSQL\n');

  try {
    // 1. Buscar usuario
    const usuario = await queryGet(client, 'SELECT id, nombre FROM usuarios WHERE email = $1', [EMAIL]);
    if (!usuario) {
      console.error(`ERROR: No se encontró usuario con email "${EMAIL}"`);
      return;
    }
    console.log(`✔ Usuario encontrado: ${usuario.nombre} (id=${usuario.id})`);

    // 1.5 Limpiar productos anteriores de este usuario en Agricultura
    const antiguos = await client.query(
      `SELECT p.id FROM productos p WHERE p.vendedor_id = $1 AND LOWER(p.categoria) = LOWER($2)`,
      [usuario.id, 'Agricultura']
    );
    if (antiguos.rows.length > 0) {
      const ids = antiguos.rows.map(r => r.id);
      await client.query(`DELETE FROM imagenes_producto WHERE producto_id = ANY($1)`, [ids]);
      await client.query(`DELETE FROM productos WHERE id = ANY($1)`, [ids]);
      await client.query(`SELECT setval('productos_id_seq', (SELECT COALESCE(MAX(id), 0) FROM productos))`);
      console.log(`✔ Eliminados ${antiguos.rows.length} productos anteriores, sequence reseteado`);
    }

    // 2. Asegurar categoría "Agricultura"
    let cat = await queryGet(client, 'SELECT id FROM categorias WHERE LOWER(nombre) = LOWER($1)', ['Agricultura']);
    if (!cat) {
      const res = await client.query(
        `INSERT INTO categorias (nombre, icono, color, cantidad) VALUES ($1, $2, $3, $4) RETURNING id`,
        ['Agricultura', '🌱', 'bg-campo-100 text-campo-700', 0]
      );
      cat = { id: res.rows[0].id };
      console.log(`✔ Categoría "Agricultura" creada (id=${cat.id})`);
    } else {
      console.log(`✔ Categoría "Agricultura" encontrada (id=${cat.id})`);
    }
    const categoriaId = cat.id;

    // 3. Productos
    const productos = [
      {
        nombre: 'Café Orgánico Supremo x kg', imagen_idx: 0,
        descripcion: 'Café arábica de alta montaña, cultivado a 1800 msnm en finca certificada orgánica. Notas a caramelo y chocolate, tueste medio. Cosecha reciente.',
        precio: 48000, precio_anterior: 55000, stock: 50,
        ubicacion: 'Manizales', departamento: 'Caldas',
        oferta: true, destacado: true,
        finca: 'Finca El Arrayán', vereda: 'Alto de San Daniel', peso: 1.0,
      },
      {
        nombre: 'Café Especial Gesha x kg', imagen_idx: 1,
        descripcion: 'Café de la variedad Gesha, uno de los más finos del mundo. Notas florales y cítricas, cuerpo sedoso. Puntaje SCA 88+. Edición limitada.',
        precio: 85000, precio_anterior: null, stock: 20,
        ubicacion: 'Chinchiná', departamento: 'Caldas',
        oferta: false, destacado: true,
        finca: 'Finca La Pradera', vereda: 'La Hermosa', peso: 1.0,
      },
      {
        nombre: 'Café Pergamino Seco x kg', imagen_idx: 2,
        descripcion: 'Café pergamino seco de primera calidad, listo para trillar. Ideal para tostadores y caficultores. Humedad controlada 10-12%.',
        precio: 32000, precio_anterior: null, stock: 100,
        ubicacion: 'Palestina', departamento: 'Caldas',
        oferta: false, destacado: false,
        finca: 'Finca Buenavista', vereda: 'El Edén', peso: 1.0,
      },
      {
        nombre: 'Café Tostado Molido 500g', imagen_idx: 3,
        descripcion: 'Café 100% arábica tostado y molido, empaque al vacío de 500g. Tueste medio, apto para cafetera de filtro, prensa francesa y espresso.',
        precio: 28000, precio_anterior: 32000, stock: 80,
        ubicacion: 'Villamaría', departamento: 'Caldas',
        oferta: true, destacado: false,
        finca: 'Finca El Ocaso', vereda: 'La Florida', peso: 0.5,
      },
      {
        nombre: 'Aguacate Hass Premium x und', imagen_idx: 4,
        descripcion: 'Aguacate Hass de primera calidad, cosecha manual. Pulpa cremosa con alto contenido de aceite. Ideal para exportación y consumo nacional.',
        precio: 8500, precio_anterior: 10000, stock: 200,
        ubicacion: 'Armenia', departamento: 'Quindío',
        oferta: true, destacado: true,
        finca: 'Finca El Bosque', vereda: 'Pueblo Tapado', peso: null,
      },
      {
        nombre: 'Aguacate Papelillo x und', imagen_idx: 5,
        descripcion: 'Aguacate papelillo tradicional, piel delgada y color verde brillante. Sabor suave y textura mantecosa. Cosecha de temporada.',
        precio: 6000, precio_anterior: null, stock: 150,
        ubicacion: 'Filandia', departamento: 'Quindío',
        oferta: false, destacado: false,
        finca: 'Finca Los Alpes', vereda: 'El Caimo', peso: null,
      },
      {
        nombre: 'Aguacate Lorena x und', imagen_idx: 6,
        descripcion: 'Aguacate variedad Lorena, piel verde oscuro, pulpa amarilla de excelente sabor. Ideal para ensaladas y guacamole.',
        precio: 4500, precio_anterior: null, stock: 180,
        ubicacion: 'Calarcá', departamento: 'Quindío',
        oferta: false, destacado: false,
        finca: 'Finca La Montaña', vereda: 'La Virginia', peso: null,
      },
      {
        nombre: 'Cacao Seco Fermentado x kg', imagen_idx: 7,
        descripcion: 'Cacao seco fermentado de alta calidad, granos bien fermentados con perfiles aromáticos a frutas y nueces.',
        precio: 22000, precio_anterior: 25000, stock: 60,
        ubicacion: 'San José', departamento: 'Caldas',
        oferta: true, destacado: true,
        finca: 'Finca La Esperanza', vereda: 'San Lorenzo', peso: 1.0,
      },
      {
        nombre: 'Cacao en Grano x kg', imagen_idx: 8,
        descripcion: 'Cacao en grano seco, fermentación controlada y secado al sol. Origen variedad CCN-51 y criollo.',
        precio: 18000, precio_anterior: null, stock: 75,
        ubicacion: 'Neira', departamento: 'Caldas',
        oferta: false, destacado: false,
        finca: 'Finca El Porvenir', vereda: 'La Miel', peso: 1.0,
      },
      {
        nombre: 'Cacao Orgánico en Polvo x kg', imagen_idx: 9,
        descripcion: 'Cacao orgánico en polvo, sin azúcares añadidos ni procesamiento alcalino. 100% puro, rico en antioxidantes.',
        precio: 35000, precio_anterior: null, stock: 40,
        ubicacion: 'Manizales', departamento: 'Caldas',
        oferta: false, destacado: false,
        finca: 'Finca El Edén', vereda: 'La Cabaña', peso: 1.0,
      },
    ];

    // 4. Insertar cada producto
    let insertados = 0;
    for (const p of productos) {
      try {
        const res = await client.query(`
          INSERT INTO productos (
            nombre, categoria, categoria_id, descripcion,
            precio, precio_anterior, stock,
            ubicacion, departamento,
            vendedor_id, vendedor_rating,
            estado, salud, envio, destacado, oferta, trazabilidad,
            tipo_precio,
            peso, peso_unitario,
            finca, vereda,
            fecha_nacimiento, sexo, video, referencia_ubicacion
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7,
            $8, $9,
            $10, $11,
            $12, $13, $14, $15, $16, $17,
            $18,
            $19, $20,
            $21, $22,
            $23, $24, $25, $26
          ) RETURNING id
        `, [
          p.nombre, 'Agricultura', categoriaId, p.descripcion,
          p.precio, p.precio_anterior ?? null, p.stock,
          p.ubicacion, p.departamento,
          usuario.id, 4.8,
          'disponible', 'Excelente', true, p.destacado ?? false, p.oferta ?? false, false,
          'fijo',
          p.peso ?? null, p.peso ?? null,
          p.finca ?? '', p.vereda ?? '',
          '', null, '', '',
        ]);

        const productoId = res.rows[0].id;

        // Insertar imagen tipo upload (public/uploads/animales/)
        const localUrl = imageRoutes[p.imagen_idx];
        await client.query(`
          INSERT INTO imagenes_producto (producto_id, url, orden)
          VALUES ($1, $2, $3)
        `, [productoId, localUrl, 0]);

        insertados++;
        console.log(`  ${insertados}. ✔ ${p.nombre} — $${p.precio.toLocaleString()} (id=${productoId})`);
      } catch (err) {
        console.error(`  ✘ Error insertando "${p.nombre}": ${err.message}`);
      }
    }

    console.log(`\n✅ ${insertados} de ${productos.length} productos insertados correctamente.`);
    console.log('Imágenes guardadas en /public/uploads/animales/');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
