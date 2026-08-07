const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function check() {
  const res = await sql`SELECT SUM(cost::numeric) FROM maintenance_records WHERE status = 'Completed'`;
  console.log('Total Maintenance Cost:', res);
}

check().catch(console.error);
