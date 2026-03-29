import * as dotenv from 'dotenv';
import type { Config } from "drizzle-kit";

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing for Drizzle config");
}

export default {
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;