import * as dotenv from 'dotenv';
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing for Drizzle config");
}

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});