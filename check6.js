const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function check() {
  const m = await sql`SELECT status, SUM(cost::numeric) FROM maintenance_records GROUP BY status`;
  console.log('Status Breakdown:', m);
}

check().catch(console.error);
