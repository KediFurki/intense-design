import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
  primaryKey,
  integer,
  boolean,
  jsonb,
  json,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccount } from "next-auth/adapters";

export const roleEnum = pgEnum("role", ["admin", "customer"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "processing", "shipped", "delivered", "cancelled"]);

export const users = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: roleEnum("role").default("customer"),
  phone: text("phone"),
  isCorporate: boolean("is_corporate").default(false),
  companyName: text("company_name"),
  taxId: text("tax_id"),
  taxOffice: text("tax_office"),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationToken", {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const categories = pgTable("category", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 7. PRODUCTS (GÜNCELLENDİ)
export const products = pgTable("product", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("categoryId").references(() => categories.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  
  // YENİ: Detaylı Açıklama ve Özellikler
  longDescription: text("long_description"), // Blog tarzı uzun yazı
  
  price: integer("price").notNull(),
  stock: integer("stock").default(0).notNull(),
  
  width: integer("width"),
  height: integer("height"),
  depth: integer("depth"),
  material: text("material"),
  
  images: json("images").$type<string[]>().default([]), 
  modelUrl: text("modelUrl"),
  maskImage: text("mask_image"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productVariants = pgTable("product_variant", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  
  name: text("name").notNull(), 
  price: integer("price").notNull(),
  stock: integer("stock").notNull(),
  
  images: json("images").$type<string[]>().default([]),
  modelUrl: text("model_url"), 
  
  attributes: jsonb("attributes").notNull(), 
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  variantName: text("variant_name"), 
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
});

// İLİŞKİLER (Değişmedi)
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