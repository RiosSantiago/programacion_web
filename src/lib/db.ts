import Database from 'better-sqlite3';
import path from 'path';
import { cwd } from 'process';
import fs from 'fs';

const dbDir = path.join(cwd(), 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'agrotech.db');

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

export function inicializarTablas() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      icono TEXT NOT NULL,
      color TEXT NOT NULL,
      cantidad INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      celular TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      password_hash TEXT,
      verificado INTEGER DEFAULT 0,
      rol TEXT DEFAULT '',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      categoria TEXT NOT NULL,
      raza TEXT,
      peso REAL,
      peso_unitario REAL,
      ubicacion TEXT NOT NULL,
      departamento TEXT NOT NULL,
      precio REAL NOT NULL,
      precio_anterior REAL,
      stock INTEGER NOT NULL,
      vendedor_id INTEGER,
      vendedor TEXT NOT NULL,
      vendedor_rating REAL,
      imagenes TEXT NOT NULL,
      estado TEXT,
      salud TEXT,
      envio INTEGER DEFAULT 0,
      destacado INTEGER DEFAULT 0,
      oferta INTEGER DEFAULT 0,
      trazabilidad INTEGER DEFAULT 0,
      descripcion TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
    );
    
    CREATE TABLE IF NOT EXISTS inventario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      raza TEXT NOT NULL,
      edad TEXT NOT NULL,
      peso REAL NOT NULL,
      ubicacion TEXT NOT NULL,
      estado TEXT NOT NULL,
      ultimo_check DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dashboard_estadisticas (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      total_cabezas INTEGER DEFAULT 0,
      alertas_salud INTEGER DEFAULT 0,
      promedio_peso REAL DEFAULT 0,
      crecimiento_mensual REAL DEFAULT 0,
      rendimiento_promedio REAL DEFAULT 0,
      produccion_leche INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS indicadores_crecimiento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mes TEXT NOT NULL,
      peso REAL NOT NULL,
      produccion INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      productos TEXT NOT NULL,
      total REAL NOT NULL,
      metodo_pago TEXT DEFAULT 'whatsapp',
      estado TEXT DEFAULT 'pendiente',
      referencia_wompi TEXT,
      nombre_comprador TEXT,
      telefono_comprador TEXT,
      direccion TEXT,
      notas TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  try { db.exec('ALTER TABLE productos ADD COLUMN tipo_precio TEXT DEFAULT \'fijo\''); } catch {}
  try { db.exec('ALTER TABLE productos ADD COLUMN sexo TEXT DEFAULT \'\''); } catch {}
  try { db.exec('ALTER TABLE productos ADD COLUMN fecha_nacimiento TEXT DEFAULT \'\''); } catch {}
  try { db.exec('ALTER TABLE productos ADD COLUMN vendedor_id INTEGER'); } catch {}
  try { db.exec('ALTER TABLE productos ADD COLUMN descripcion TEXT DEFAULT \'\''); } catch {}
  try { db.exec('ALTER TABLE usuarios ADD COLUMN password_text TEXT DEFAULT \'\''); } catch {}
  try { db.exec('ALTER TABLE usuarios ADD COLUMN hacienda TEXT DEFAULT \'\''); } catch {}
  try { db.exec('ALTER TABLE usuarios ADD COLUMN ciudad TEXT DEFAULT \'\''); } catch {}
  try { db.exec('ALTER TABLE usuarios ADD COLUMN direccion TEXT DEFAULT \'\''); } catch {}
  try { db.exec('ALTER TABLE usuarios ADD COLUMN municipio TEXT DEFAULT \'\''); } catch {}
  try { db.exec('ALTER TABLE usuarios ADD COLUMN corregimiento TEXT DEFAULT \'\''); } catch {}
  try { db.exec('ALTER TABLE productos ADD COLUMN video TEXT DEFAULT \'\''); } catch {}
}

export function inicializarDatos() {
  const categoriasCount = db.prepare('SELECT COUNT(*) as count FROM categorias').get() as { count: number };
  
  if (categoriasCount.count === 0) {
    const insertCategoria = db.prepare(`
      INSERT INTO categorias (nombre, icono, color, cantidad) VALUES (?, ?, ?, ?)
    `);
    
    const categorias = [
      ['Bovinos', '🐄', 'bg-emerald-100 text-emerald-700', 284],
      ['Equinos', '🐴', 'bg-blue-100 text-blue-700', 42],
      ['Porcinos', '🐷', 'bg-amber-100 text-amber-700', 156],
      ['Ovinos', '🐑', 'bg-purple-100 text-purple-700', 0],
      ['Avicolas', '🐔', 'bg-orange-100 text-orange-700', 89],
      ['Agricultura', '🌱', 'bg-green-100 text-green-700', 0],
      ['Insumos', '🧰', 'bg-slate-100 text-slate-700', 0],
    ];
    
    for (const cat of categorias) {
      insertCategoria.run(...cat);
    }
  }

  // Ensure Agricultura and Insumos exist (for existing DBs)
  const insertIfMissing = db.prepare('INSERT OR IGNORE INTO categorias (nombre, icono, color, cantidad) VALUES (?, ?, ?, ?)');
  insertIfMissing.run('Agricultura', '🌱', 'bg-green-100 text-green-700', 0);
  insertIfMissing.run('Insumos', '🧰', 'bg-slate-100 text-slate-700', 0);
  insertIfMissing.run('Ovinos', '🐑', 'bg-purple-100 text-purple-700', 0);


  const inventarioCount = db.prepare('SELECT COUNT(*) as count FROM inventario').get() as { count: number };
  
  if (inventarioCount.count === 0) {
    const insertInventario = db.prepare(`
      INSERT INTO inventario (codigo, nombre, raza, edad, peso, ubicacion, estado, ultimo_check)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const inventario = [
      ['AN-001', 'Toro Emperador', 'Angus Negro', '3 años', 485, 'Potrero Norte', 'Activo', '2026-04-28'],
      ['BR-042', 'Vaca Lucero', 'Brahman Rojo', '4 años', 390, 'Potrero Sur', 'Alerta', '2026-04-25'],
      ['HO-118', 'Novillo Estrella', 'Holstein', '2 años', 420, 'Establo Central', 'Activo', '2026-05-01'],
      ['HR-076', 'Vaca Primavera', 'Hereford', '5 años', 445, 'Potrero Este', 'Activo', '2026-04-30'],
      ['CH-203', 'Toro Caudillo', 'Charolais', '4 años', 520, 'Potrero Oeste', 'Activo', '2026-05-02'],
      ['GY-089', 'Vaca Esperanza', 'Gyr Lechero', '3 años', 350, 'Establo Sur', 'Observacion', '2026-04-22'],
      ['AN-155', 'Novillo Centella', 'Angus Negro', '2 años', 380, 'Potrero Norte', 'Activo', '2026-05-03'],
      ['BR-291', 'Vaca Montaña', 'Brahman Rojo', '6 años', 410, 'Potrero Sur', 'Activo', '2026-04-29'],
    ];
    
    for (const inv of inventario) {
      insertInventario.run(...inv);
    }
  }

  const statsCount = db.prepare('SELECT COUNT(*) as count FROM dashboard_estadisticas').get() as { count: number };
  
  if (statsCount.count === 0) {
    db.prepare(`
      INSERT INTO dashboard_estadisticas (id, total_cabezas, alertas_salud, promedio_peso, crecimiento_mensual, rendimiento_promedio, produccion_leche)
      VALUES (1, 1847, 8, 412, 4.2, 11.8, 3250)
    `).run();
  }

  const indicadoresCount = db.prepare('SELECT COUNT(*) as count FROM indicadores_crecimiento').get() as { count: number };
  
  if (indicadoresCount.count === 0) {
    const insertIndicador = db.prepare(`
      INSERT INTO indicadores_crecimiento (mes, peso, produccion) VALUES (?, ?, ?)
    `);
    
    const indicadores = [
      ['Ene', 380, 2800], ['Feb', 388, 2950], ['Mar', 395, 3050], ['Abr', 405, 3180],
      ['May', 412, 3250], ['Jun', 420, 3350], ['Jul', 428, 3400], ['Ago', 435, 3480],
      ['Sep', 440, 3550], ['Oct', 445, 3600], ['Nov', 450, 3680], ['Dic', 455, 3750],
    ];
    
    for (const ind of indicadores) {
      insertIndicador.run(...ind);
    }
  }
}

export function inicializar() {
  inicializarTablas();
  inicializarDatos();
}

inicializar();