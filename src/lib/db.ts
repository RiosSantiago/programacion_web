// =============================================================================
// CONEXIÓN A POSTGRESQL — AGROUP
// Motor: @electric-sql/pglite (local sin Docker) | pg Pool (Neon / Docker)
// =============================================================================
// CÓDIGO SQLITE ORIGINAL CONSERVADO AL FINAL (referencia aislada según plan)
// =============================================================================

import pg from 'pg';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const connectionString = (import.meta.env.DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@127.0.0.1:4322/agroup?sslmode=disable').trim();

// Instancia única (singleton) de pg.Pool — conexión TCP a PostgreSQL (Docker / Neon)
export const pool = new Pool({
  connectionString,
});

// ---------------------------------------------------------------------------
// HELPER: Convierte strings NUMERIC de Postgres ("5000000.00") a number JS
// aplica solo para columnas de precio, peso, total y rating.
// ---------------------------------------------------------------------------
function parseNumericFields(rows: any[]): any[] {
  if (!Array.isArray(rows)) return rows;
  const numericKeys = /precio|peso|total|rating|cantidad|stock|crecimiento|rendimiento|produccion|promedio/i;
  return rows.map(row => {
    if (!row || typeof row !== 'object') return row;
    const out: any = {};
    for (const key of Object.keys(row)) {
      const val = row[key];
      if (typeof val === 'string' && numericKeys.test(key) && /^-?\d+(\.\d+)?$/.test(val)) {
        out[key] = parseFloat(val);
      } else {
        out[key] = val;
      }
    }
    return out;
  });
}

// ---------------------------------------------------------------------------
// HELPER: Traduce ? posicionales → $1 $2 … y @named → $1 $2 …
// También reemplaza sintaxis exclusiva de SQLite.
// ---------------------------------------------------------------------------
export function buildQuery(sql: string, params: any[] | Record<string, any> = []): { text: string; values: any[] } {
  let text = sql;
  const values: any[] = [];

  // Sintaxis SQLite incompatible con Postgres
  text = text.replace(/\bINSERT\s+OR\s+IGNORE\b/gi, 'INSERT ON CONFLICT DO NOTHING');
  text = text.replace(/\blast_insert_rowid\(\)/gi, 'lastval()');
  // Operadores booleanos en SQL (1 → true)
  text = text.replace(/\b(destacado|trazabilidad|envio|oferta|verificado)\s*=\s*1\b/gi, '$1 = true');
  text = text.replace(/\b(destacado|trazabilidad|envio|oferta|verificado)\s*=\s*0\b/gi, '$1 = false');
  // LIKE insensible a mayúsculas: LOWER(x) LIKE ? → x ILIKE $n
  text = text.replace(/LOWER\(([^)]+)\)\s+LIKE\s+\?/gi, '$1 ILIKE ?');

  if (Array.isArray(params) && params.length > 0) {
    let i = 1;
    text = text.replace(/\?/g, () => `$${i++}`);
    values.push(...params);
  } else if (params && typeof params === 'object' && !Array.isArray(params)) {
    const obj = params as Record<string, any>;
    text = text.replace(/@(\w+)/g, (_, key) => {
      values.push(obj[key] ?? null);
      return `$${values.length}`;
    });
  }

  return { text, values };
}

// ---------------------------------------------------------------------------
// API PÚBLICA — todas las funciones son async
// ---------------------------------------------------------------------------

/** Ejecuta una query que devuelve múltiples filas */
export async function queryAll<T = any>(sql: string, params: any[] | Record<string, any> = []): Promise<T[]> {
  const { text, values } = buildQuery(sql, params);
  const res = await pool.query<T>(text, values);
  return parseNumericFields(res.rows as any[]) as T[];
}

/** Ejecuta una query que devuelve una sola fila (o undefined) */
export async function queryGet<T = any>(sql: string, params: any[] | Record<string, any> = []): Promise<T | undefined> {
  const rows = await queryAll<T>(sql, params);
  return rows[0];
}

/** Ejecuta INSERT/UPDATE/DELETE; para INSERT devuelve el id insertado */
export async function queryRun(sql: string, params: any[] | Record<string, any> = []): Promise<{ changes: number; lastInsertRowid: number }> {
  let { text, values } = buildQuery(sql, params);

  // Para INSERT, agrega RETURNING id para capturar el nuevo id
  const isInsert = /^\s*INSERT\s+/i.test(text);
  if (isInsert && !/RETURNING\s+id\b/i.test(text)) {
    text += ' RETURNING id';
  }

  const res = await pool.query(text, values);
  const lastInsertRowid = isInsert && res.rows?.length ? Number((res.rows[0] as any).id) : 0;
  return {
    changes: res.rowCount ?? res.rows?.length ?? 0,
    lastInsertRowid,
  };
}

/** Ejecuta DDL o scripts multi-statement */
export async function execSql(sql: string): Promise<void> {
  await pool.query(sql);
}

// ---------------------------------------------------------------------------
// INICIALIZACIÓN — crea el esquema si no existe + corre migraciones
// ---------------------------------------------------------------------------
let _initialized = false;

export async function inicializar(): Promise<void> {
  if (_initialized) return;
  _initialized = true;
  const ddlPath = path.join(process.cwd(), 'database', 'schema.pg.sql');
  if (fs.existsSync(ddlPath)) {
    const ddl = fs.readFileSync(ddlPath, 'utf8');
    await pool.query(ddl);
  }

  // Migraciones: tabla de control y ejecución pendiente
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrationsDir = path.join(process.cwd(), 'database', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      const already = await pool.query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
      if (already.rowCount && already.rowCount > 0) continue;

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      console.log(`[migración] aplicada: ${file}`);
    }
  }
}

// =============================================================================
// REFERENCIA AISLADA — CÓDIGO SQLITE ORIGINAL (NO ELIMINAR HASTA CONFIRMACIÓN)
// =============================================================================
// import Database from 'better-sqlite3';
// import path from 'path';
// import { cwd } from 'process';
// import fs from 'fs';
//
// const dbDir = path.join(cwd(), 'database');
// if (!fs.existsSync(dbDir)) { fs.mkdirSync(dbDir, { recursive: true }); }
// const dbPath = path.join(dbDir, 'agroup.db');
// export const db = new Database(dbPath);
// db.pragma('journal_mode = WAL');
//
// export function inicializarTablas() { db.exec(`...`); }
// export function inicializarDatos()  { /* seed data */ }
// export function inicializar()       { inicializarTablas(); inicializarDatos(); }
// =============================================================================