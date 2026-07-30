const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgrespassword@localhost:5432/agroup' });

function generarSlug(nombre) {
  return nombre.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

async function run() {
  const r = await pool.query('SELECT id, nombre FROM categorias');
  for (const c of r.rows) {
    const slug = generarSlug(c.nombre);
    await pool.query('UPDATE categorias SET slug = $1 WHERE id = $2', [slug, c.id]);
    console.log(`Updated category ${c.id}: ${c.nombre} -> ${slug}`);
  }
  await pool.end();
  console.log('ALL SLUGS POPULATED SUCCESSFULLY');
}

run().catch(console.error);
