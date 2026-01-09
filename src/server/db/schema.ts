import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm"; // <-- BUNU EKLEDİK
import type { AdapterAccount } from "next-auth/adapters";

// 1. ENUMS
export const roleEnum = pgEnum("role", ["admin", "customer"]);

// 2. USERS TABLE
export const users = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: roleEnum("role").default("customer"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 3. ACCOUNTS TABLE
export const accounts = pgTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

// 4. SESSIONS TABLE
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// 5. VERIFICATION TOKENS
export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// 6. CATEGORIES
export const categories = pgTable("category", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 7. PRODUCTS
export const products = pgTable("product", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // SQL Foreign Key (Veritabanı düzeyinde ilişki)
  categoryId: uuid("categoryId").references(() => categories.id),
  
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  stock: integer("stock").default(0),
  
  // Teknik Özellikler
  width: integer("width"),
  height: integer("height"),
  depth: integer("depth"),
  material: text("material"),
  
  // Medya Dosyaları
  images: text("images").array(), 
  modelUrl: text("modelUrl"), // 3D Model dosyası
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- İLİŞKİLER (RELATIONS) ---
// Burası Drizzle'ın sorgularda tabloları birleştirmesini sağlar.

// Bir Ürünün Bir Kategorisi olur.
export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

// Bir Kategorinin Çok Ürünü olur.
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));