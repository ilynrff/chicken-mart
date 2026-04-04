import { sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { DebtStatus, PaymentMethod } from "@/lib/types";

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
    total: integer("total").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  },
  (table) => ({
    workspaceCreatedIndex: index("transactions_workspace_created_idx").on(table.workspaceId, table.createdAt),
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

export const debts = pgTable(
  "debts",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull().default(""),
    amount: integer("amount").notNull(),
    dueDate: text("due_date").notNull(),
    note: text("note").notNull().default(""),
    status: text("status").$type<DebtStatus>().notNull().default("aktif"),
    reminderCount: integer("reminder_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
  },
  (table) => ({
    workspaceStatusIndex: index("debts_workspace_status_idx").on(table.workspaceId, table.status),
  }),
);
