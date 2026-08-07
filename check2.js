const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function check() {
  const t = await sql`SELECT id, plate_no FROM trucks`;
  console.log('Trucks:', t);
  const m = await sql`SELECT id, description, truck_id, autoworx_job_id, category FROM maintenance_records`;
  console.log('Maintenance:', m);
}

check().catch(console.error);
