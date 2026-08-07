const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function check() {
  const m = await sql`SELECT SUM(cost::numeric) FROM maintenance_records`;
  console.log('Total Maintenance ALL STATUS:', m);
}

check().catch(console.error);
