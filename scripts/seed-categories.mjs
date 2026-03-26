import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is missing in .env.local");
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL });

const fixedCategories = [
  {
    name: JSON.stringify({ en: "Living Room", tr: "Oturma Odası", de: "Wohnzimmer", bg: "Дневна" }),
    slug: "living-room",
    description: JSON.stringify({ en: "Living room furniture", tr: "Oturma odası mobilyaları", de: "Wohnzimmermöbel", bg: "Мебели за дневна" }),
  },
  {
    name: JSON.stringify({ en: "Bedroom", tr: "Yatak Odası", de: "Schlafzimmer", bg: "Спалня" }),
    slug: "bedroom",
    description: JSON.stringify({ en: "Bedroom furniture", tr: "Yatak odası mobilyaları", de: "Schlafzimmermöbel", bg: "Мебели за спалня" }),
  },
  {
    name: JSON.stringify({ en: "Dining", tr: "Yemek Odası", de: "Esszimmer", bg: "Трапезария" }),
    slug: "dining",
    description: JSON.stringify({ en: "Dining room furniture", tr: "Yemek odası mobilyaları", de: "Esszimmermöbel", bg: "Мебели за трапезария" }),
  },
];

async function seed() {
  await client.connect();
  console.log("Connected to database");

  for (const cat of fixedCategories) {
    const result = await client.query(
      `INSERT INTO category (id, name, slug, description, created_at)
       VALUES (gen_random_uuid(), $1::jsonb, $2, $3::jsonb, NOW())
       ON CONFLICT (slug) DO NOTHING
       RETURNING slug`,
      [cat.name, cat.slug, cat.description]
    );

    if (result.rowCount > 0) {
      console.log(`✓ Inserted: ${cat.slug}`);
    } else {
      console.log(`– Already exists: ${cat.slug}`);
    }
  }

  await client.end();
  console.log("Done!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
