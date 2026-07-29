import { pool } from './src/lib/db.ts';

async function main() {
  // Añadir orden_id si no existe
  await pool.query(`
    ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS orden_id VARCHAR(50) DEFAULT ''
  `);
  console.log('✅ Columna orden_id añadida (o ya existía).');

  const r = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='pedidos' ORDER BY ordinal_position"
  );
  console.log('Columnas actuales de pedidos:', r.rows.map(c => c.column_name));
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
