import { db } from "./src/db/index";
import { maintenanceRecords } from "./src/db/schema";

async function run() {
  try {
    console.log("Checking DB...");
    const existing = await db.query.maintenanceRecords.findFirst();
    console.log("Found:", existing);
  } catch (e) {
    console.error("DB Error:", e);
  }
}
run();
