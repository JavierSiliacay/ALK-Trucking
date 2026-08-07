const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function fix() {
  await sql`UPDATE maintenance_records SET status = 'Completed' WHERE status ILIKE 'completed' OR status ILIKE 'contacted'`;
  console.log('Statuses normalized to Completed!');
}

fix().catch(console.error);
