const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function check() {
  const m = await sql`SELECT SUM(cost::numeric) FROM maintenance_records WHERE status = 'Completed'`;
  console.log('Total Maintenance:', m);
  
  const i = await sql`SELECT SUM(total_cost::numeric) FROM inventory_transactions WHERE type = 'STOCK-OUT'`;
  console.log('Total Inventory:', i);
  
  const e = await sql`SELECT SUM(amount::numeric) FROM expenses`;
  console.log('Total Trip Expenses:', e);
}

check().catch(console.error);
