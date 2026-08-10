import { db } from './src/db/index';
import { sql } from 'drizzle-orm';

async function main() {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS system_settings (key varchar(255) PRIMARY KEY NOT NULL, value varchar(255) NOT NULL);`);
  await db.execute(sql`INSERT INTO system_settings (key, value) VALUES ('ENABLE_AUTOWORX_SYNC', 'true') ON CONFLICT (key) DO NOTHING;`);
  console.log('Table created');
  process.exit(0);
}

main();
