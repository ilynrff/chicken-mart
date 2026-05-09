import { sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { PaymentMethod } from "@/lib/types";

export const workspaces = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id").notNull().unique(),
    name: text("name").notNull(),
    ownerName: text("owner_name").notNull(),
    address: text("address").notNull().default(""),
    phone: text("phone").notNull().default(""),
    enabledPaymentMethods: text("enabled_payment_methods")
      .array()
      .$type<PaymentMethod[]>()
      .notNull()
      .default(sql`ARRAY['Tunai','QRIS','Transfer']::text[]`),
    defaultMinimumStock: integer("default_minimum_stock").notNull().default(8),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => ({
    ownerUserIdIndex: index("workspaces_owner_user_id_idx").on(table.ownerUserId),
  }),
);

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull(),
    buyPrice: integer("buy_price").notNull(),
    sellPrice: integer("sell_price").notNull(),
    stock: integer("stock").notNull(),
    minimumStock: integer("minimum_stock").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
  },
  (table) => ({
    workspaceIndex: index("products_workspace_id_idx").on(table.workspaceId),
  }),
);

export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    paymentMethod: text("payment_method").$type<PaymentMethod>().notNull(),
    status: text("status").$type<"PAID" | "UNPAID">().notNull().default("PAID"),
    customerName: text("customer_name"),
    customerPhone: text("customer_phone"),
    dueDate: text("due_date"),
    total: integer("total").notNull(),
    invoiceCode: text("invoice_code"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  },
  (table) => ({
    workspaceCreatedIndex: index("transactions_workspace_created_idx").on(table.workspaceId, table.createdAt),
    workspaceStatusIndex: index("transactions_workspace_status_idx").on(table.workspaceId, table.status),
  }),
);

export const transactionItems = pgTable(
  "transaction_items",
  {
    id: text("id").primaryKey(),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    productName: text("product_name").notNull(),
    buyPrice: integer("buy_price").notNull(),
    sellPrice: integer("sell_price").notNull(),
    qty: integer("qty").notNull(),
    subtotal: integer("subtotal").notNull(),
  },
  (table) => ({
    transactionIndex: index("transaction_items_transaction_id_idx").on(table.transactionId),
  }),
);

export const debtPayments = pgTable(
  "debt_payments",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    method: text("method").$type<PaymentMethod>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  },
  (table) => ({
    transactionIndex: index("debt_payments_transaction_id_idx").on(table.transactionId),
  }),
);

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    icon: text("icon"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  },
  (table) => ({
    workspaceIndex: index("categories_workspace_id_idx").on(table.workspaceId),
  }),
);
