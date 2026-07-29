import fs from 'fs';
import path from 'path';
import { pool } from './src/lib/db.ts';

async function backupDatabase() {
  console.log('Iniciando backup de PostgreSQL...');
  const tablesRes = await pool.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`
  );
  
  let sqlDump = `-- BACKUP AGROUP POSTGRESQL - ${new Date().toISOString()}\n\n`;

  for (const { table_name } of tablesRes.rows) {
    const rowsRes = await pool.query(`SELECT * FROM "${table_name}"`);
    sqlDump += `-- TABLA: ${table_name} (${rowsRes.rows.length} filas)\n`;
    if (rowsRes.rows.length > 0) {
      const keys = Object.keys(rowsRes.rows[0]);
      for (const row of rowsRes.rows) {
        const values = keys.map(k => {
          const val = row[k];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'boolean' || typeof val === 'number') return val;
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        sqlDump += `INSERT INTO "${table_name}" ("${keys.join('", "')}") VALUES (${values.join(', ')});\n`;
      }
    }
    sqlDump += `\n`;
  }

  const backupPath = path.join(process.cwd(), 'database', 'backup_before_phase1_norm.sql');
  fs.writeFileSync(backupPath, sqlDump, 'utf8');
  console.log(`✅ Backup completado exitosamente en: ${backupPath}`);
  process.exit(0);
}

backupDatabase().catch(err => {
  console.error('Error durante backup:', err);
  process.exit(1);
});
