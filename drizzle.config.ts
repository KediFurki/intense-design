import * as dotenv from 'dotenv';
import type { Config } from "drizzle-kit";

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing for Drizzle config");
}

export default {
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  connectionString: process.env.DATABASE_URL,
} satisfies Config;