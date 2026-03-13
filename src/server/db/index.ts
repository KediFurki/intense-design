import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema"; // <-- ÖNEMLİ: Şemayı import ediyoruz

// Eğer veritabanı URL'i yoksa hata fırlat (Güvenlik önlemi)
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in .env file");
}

const sql = neon(process.env.DATABASE_URL);

// ÖNEMLİ: { schema } parametresini buraya ekliyoruz
// Bu sayede db.query.products.findFirst() gibi komutlar çalışacak.
export const db = drizzle({ client: sql, schema });