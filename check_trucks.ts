import { db } from './src/db/index';
import { trucks } from './src/db/schema';
async function main() {
  const result = await db.select().from(trucks);
  console.log(result);
}
main();
