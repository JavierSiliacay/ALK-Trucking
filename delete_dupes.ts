import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const result = await sql`DELETE FROM maintenance_records WHERE autoworx_job_id LIKE '2026%' RETURNING *`;
  console.log(`Deleted ${result.length} old records.`);
}
run().catch(console.error);
