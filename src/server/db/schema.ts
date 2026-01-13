import { relations } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uuid, integer, boolean, jsonb, primaryKey, json } from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

export const roleEnum = pgEnum("role", ["admin", "customer"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "processing", "shipped", "delivered", "cancelled"]);
// Ürün Tipleri (Özellik seti buna göre değişecek)
export const productTypeEnum = pgEnum("product_type", ["furniture", "sofa", "bed", "kitchen", "lighting", "decoration"]);

export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeName: text("store_name").default("Instant Design").notNull(),
  supportEmail: text("support_email").default("support@example.com").notNull(),
  currency: text("currency").default("EUR").notNull(),
  maintenanceMode: boolean("maintenance_mode").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// USERS
export const users = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: roleEnum("role").default("customer"),
  createdAt: timestamp("created_at").defaultNow(),
});

// CATEGORIES (Çoklu Dil)
export const categories = pgTable("category", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: jsonb("name").notNull(), // {en: "Chair", tr: "Sandalye"}
  slug: text("slug").notNull().unique(),
  description: jsonb("description"), // {en: "...", tr: "..."}
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// PRODUCTS (Çoklu Dil & Gelişmiş Özellikler)
export const products = pgTable("product", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("categoryId").references(() => categories.id),
  
  // ÇOKLU DİL DESTEĞİ
  name: jsonb("name").notNull(), // {en: "Modern Sofa", tr: "Modern Koltuk"}
  description: jsonb("description").notNull(), 
  longDescription: jsonb("long_description"),
  
  slug: text("slug").notNull().unique(),
  type: productTypeEnum("type").default("furniture"), // Ürün Tipi

  price: integer("price").notNull(),
  stock: integer("stock").default(0).notNull(),
  
  // Fiziksel Özellikler
  width: integer("width"),
  height: integer("height"),
  depth: integer("depth"),
  
  images: json("images").$type<string[]>().default([]), 
  modelUrl: text("modelUrl"),
  maskImage: text("mask_image"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// VARIANTS
export const productVariants = pgTable("product_variant", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  
  name: jsonb("name").notNull(), // {en: "Red / XL", tr: "Kırmızı / XL"}
  price: integer("price").notNull(),
  stock: integer("stock").notNull(),
  
  images: json("images").$type<string[]>().default([]),
  
  // Teknik Özellikler (JSONB içinde saklanır: colorCode, material vb.)
  attributes: jsonb("attributes").notNull(), 
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ORDERS & ITEMS
export const orders = pgTable("order", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId").references(() => users.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  country: text("country").notNull(),
  state: text("state").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  zipCode: text("zip_code").notNull(),
  invoiceType: text("invoice_type").default("individual"),
  taxId: text("tax_id"),
  companyName: text("company_name"),
  taxOffice: text("tax_office"),
  totalAmount: integer("total_amount").notNull(),
  status: orderStatusEnum("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_item", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("productId").references(() => products.id),
  variantName: text("variant_name"), // Satın alındığı andaki ismi (Snaphost)
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
});

// --- İLİŞKİLER ---
export const addresses = pgTable("address", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    zipCode: text("zip_code").notNull(),
    country: text("country").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
  
export const favorites = pgTable("favorite", {
    userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
}, (t) => ({
    pk: primaryKey({ columns: [t.userId, t.productId] }),
}));

export const accounts = pgTable("account", {
    userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
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
}, (account) => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
}));

export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationToken", {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
}, (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    orders: many(orders),
    addresses: many(addresses),
    favorites: many(favorites),
}));
export const addressesRelations = relations(addresses, ({ one }) => ({
    user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));
export const favoritesRelations = relations(favorites, ({ one }) => ({
    user: one(users, { fields: [favorites.userId], references: [users.id] }),
    product: one(products, { fields: [favorites.productId], references: [products.id] }),
}));
export const productsRelations = relations(products, ({ one, many }) => ({
    category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
    variants: many(productVariants),
    orderItems: many(orderItems),
    favoritedBy: many(favorites),
}));
export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
    product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));
export const categoriesRelations = relations(categories, ({ many }) => ({
    products: many(products),
}));
export const ordersRelations = relations(orders, ({ one, many }) => ({
    user: one(users, { fields: [orders.userId], references: [users.id] }),
    items: many(orderItems),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
    product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));