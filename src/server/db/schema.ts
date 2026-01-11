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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccount } from "next-auth/adapters";

// 1. ENUMS
export const roleEnum = pgEnum("role", ["admin", "customer"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "processing", "shipped", "delivered", "cancelled"]);

// 2. USERS TABLE
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

// 2.1 ADDRESSES TABLE
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

// 2.2 FAVORITES TABLE
export const favorites = pgTable("favorite", {
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.productId] }),
}));

// 3. ACCOUNTS
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

// 4. SESSIONS
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// 5. VERIFICATION TOKENS
export const verificationTokens = pgTable("verificationToken", {
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

// 7. PRODUCTS (Güncellendi: Varyasyon Desteği)
export const products = pgTable("product", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("categoryId").references(() => categories.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  
  // Baz Fiyat ve Stok (Varyasyon yoksa bunlar kullanılır)
  price: integer("price").notNull(),
  stock: integer("stock").default(0).notNull(),
  
  // Boyutlar
  width: integer("width"),
  height: integer("height"),
  depth: integer("depth"),
  material: text("material"),
  
  images: text("images").array(), 
  modelUrl: text("modelUrl"),
  
  // YENİ: Bu ürünün varyasyonu var mı?
  hasVariants: boolean("has_variants").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 7.1 PRODUCT VARIANTS (YENİ TABLO)
export const productVariants = pgTable("product_variant", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  
  name: text("name").notNull(), // Örn: "Kırmızı / Large"
  sku: text("sku"), // Stok kodu
  
  price: integer("price").notNull(), // Varyasyona özel fiyat
  stock: integer("stock").default(0).notNull(), // Varyasyona özel stok
  
  image: text("image"), // Varyasyonun resmi (örn: sadece kırmızı koltuk fotosu)
  
  // JSONB ile esnek özellikler: { "Color": "Red", "Size": "XL", "Material": "Velvet" }
  attributes: jsonb("attributes").notNull(), 
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 8. ORDERS
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

// 9. ORDER ITEMS (Güncellendi: VariantId eklendi)
export const orderItems = pgTable("order_item", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("productId").references(() => products.id),
  
  // YENİ: Eğer varyasyonlu bir ürünse, hangi varyasyonun satıldığını tutar.
  variantId: uuid("variantId").references(() => productVariants.id),
  
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
});

// --- İLİŞKİLER ---

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
  variants: many(productVariants), // <-- Ürünün varyasyonları
  orderItems: many(orderItems),
  favoritedBy: many(favorites),
}));

// YENİ İLİŞKİ: Varyasyonlar
export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  orderItems: many(orderItems),
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
  variant: one(productVariants, { fields: [orderItems.variantId], references: [productVariants.id] }), // <-- Varyasyon ilişkisi
}));