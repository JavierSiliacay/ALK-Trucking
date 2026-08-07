const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'maintenance_records'`.then(res => {
  console.log(res);
}).catch(console.error);
