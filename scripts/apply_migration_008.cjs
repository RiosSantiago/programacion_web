const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@127.0.0.1:5432/agroup'
});

async function run() {
  try {
    console.log('Conectando a PostgreSQL...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const sqlPath = path.join(__dirname, '..', 'database', 'migrations', '008_drop_password_text.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Ejecutando 008_drop_password_text.sql...');
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', ['008_drop_password_text.sql']);
    
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'usuarios'");
    const cols = res.rows.map(r => r.column_name);
    console.log('Columnas actuales de usuarios:', cols.join(', '));
    console.log('¿password_text presente?:', cols.includes('password_text'));
    console.log('✅ Migración 008 aplicada con éxito en la base de datos de desarrollo.');
  } catch (err) {
    console.error('Error aplicando migración:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
