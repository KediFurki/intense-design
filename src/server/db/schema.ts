import { relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";
import type { LocalizedText } from "@/lib/i18n/get-locale-value";

/**
 * Enums
 */
export const roleEnum = pgEnum("role", ["admin", "customer"]);

export const orderStatusEnum = pgEnum("order_status", [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "expired",
  ]);

export const productTypeEnum = pgEnum("product_type", [
  "furniture",
  "sofa",
  "bed",
  "kitchen",
  "lighting",
  "decoration",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "awaiting_payment",
  "paid",
  "deposit_paid",
  "remaining_due",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "stripe",
  "iban",
  "cash_on_installation",
]);

/**
 * Settings
 */
export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeName: text("store_name").default("Intense Design").notNull(),
  supportEmail: text("support_email").default("support@example.com").notNull(),
  currency: text("currency").default("EUR").notNull(),
  maintenanceMode: boolean("maintenance_mode").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Auth (NextAuth compatible)
 */
export const users = pgTable("user", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name"),
    email: text("email").unique(),
    password: text("password"),
    role: roleEnum("role").default("customer").notNull(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  });

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

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

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

/**
 * Catalog
 */
export const categories = pgTable("category", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: jsonb("name").$type<LocalizedText>().notNull(),
  slug: text("slug").notNull().unique(),
  description: jsonb("description").$type<LocalizedText>(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("product", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Launch kuralı: ürün kategoriye bağlı olmalı
  categoryId: uuid("categoryId")
    .notNull()
    .references(() => categories.id),

  name: jsonb("name").$type<LocalizedText>().notNull(),
  description: jsonb("description").$type<LocalizedText>(),
  longDescription: jsonb("long_description").$type<LocalizedText>(),

  slug: text("slug").notNull().unique(),
  type: productTypeEnum("type").default("furniture"),
  price: integer("price").notNull(),
  stock: integer("stock").default(0).notNull(),

  width: integer("width"),
  height: integer("height"),
  depth: integer("depth"),
  material: text("material"),

  images: jsonb("images").$type<string[]>().default([]).notNull(),
  modelUrl: text("modelUrl"),
  maskImage: text("mask_image"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productVariants = pgTable("product_variant", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("productId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  name: jsonb("name").$type<LocalizedText>().notNull(),
  price: integer("price").notNull(),
  stock: integer("stock").notNull(),
  images: jsonb("images").$type<string[]>().default([]).notNull(),

  attributes: jsonb("attributes").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * User data
 */
export const addresses = pgTable("address", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),

  // Contact info (stored per address so checkout can prefill)
  // Nullable to keep backward compatibility with existing rows.
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),

  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favorites = pgTable(
  "favorite",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("productId")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.productId] }),
  })
);

/**
 * Orders
 */
export const orders = pgTable("order", {
  id: uuid("id").defaultRandom().primaryKey(),

  // guest checkout için nullable kalsın
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

  paymentStatus: paymentStatusEnum("payment_status").default("awaiting_payment").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("stripe").notNull(),

  depositPercent: integer("deposit_percent").default(0).notNull(),
  remainingAmount: integer("remaining_amount").default(0).notNull(),

  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),

  paymentDueAt: timestamp("payment_due_at"),
  stockReserved: boolean("stock_reserved").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_item", {
  id: uuid("id").defaultRandom().primaryKey(),

  orderId: uuid("orderId")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),

  // Order item product’suz olamaz
  productId: uuid("productId")
    .notNull()
    .references(() => products.id),

  variantId: uuid("variantId").references(() => productVariants.id),
  variantName: text("variant_name"),

  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
});

/**
 * Relations
 */
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

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  variants: many(productVariants),
  orderItems: many(orderItems),
  favoritedBy: many(favorites),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
    user: one(users, { fields: [orders.userId], references: [users.id] }),
    items: many(orderItems),
  }));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));