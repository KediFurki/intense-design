import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema"; // <-- ÖNEMLİ: Şemayı import ediyoruz

// Eğer veritabanı URL'i yoksa hata fırlat (Güvenlik önlemi)
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in .env file");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ÖNEMLİ: { schema } parametresini buraya ekliyoruz
// Bu sayede db.query.products.findFirst() gibi komutlar çalışacak.
export const db = drizzle(pool, { schema });