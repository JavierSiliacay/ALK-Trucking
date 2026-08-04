import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Check if DATABASE_URL is defined, otherwise throw a helpful error
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in the environment variables.");
}

// Create the Neon SQL client
const sql = neon(process.env.DATABASE_URL);

// Create the Drizzle ORM instance with the schema
export const db = drizzle(sql, { schema });
