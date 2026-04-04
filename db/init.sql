CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL UNIQUE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("user_id");

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("user_id");

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");

CREATE TABLE IF NOT EXISTS "workspaces" (
  "id" text PRIMARY KEY,
  "owner_user_id" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "owner_name" text NOT NULL,
  "address" text NOT NULL DEFAULT '',
  "phone" text NOT NULL DEFAULT '',
  "enabled_payment_methods" text[] NOT NULL DEFAULT ARRAY['Tunai','QRIS','Transfer']::text[],
  "default_minimum_stock" integer NOT NULL DEFAULT 8,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "workspaces_owner_user_id_idx" ON "workspaces" ("owner_user_id");

CREATE TABLE IF NOT EXISTS "products" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "buy_price" integer NOT NULL,
  "sell_price" integer NOT NULL,
  "stock" integer NOT NULL,
  "minimum_stock" integer NOT NULL,
  "image" text,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS "products_workspace_id_idx" ON "products" ("workspace_id");

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "payment_method" text NOT NULL,
  "total" integer NOT NULL,
  "created_at" timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS "transactions_workspace_created_idx" ON "transactions" ("workspace_id", "created_at");

CREATE TABLE IF NOT EXISTS "transaction_items" (
  "id" text PRIMARY KEY,
  "transaction_id" text NOT NULL REFERENCES "transactions"("id") ON DELETE CASCADE,
  "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "product_name" text NOT NULL,
  "buy_price" integer NOT NULL,
  "sell_price" integer NOT NULL,
  "qty" integer NOT NULL,
  "subtotal" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS "transaction_items_transaction_id_idx" ON "transaction_items" ("transaction_id");

CREATE TABLE IF NOT EXISTS "debts" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "customer_name" text NOT NULL,
  "phone" text NOT NULL DEFAULT '',
  "amount" integer NOT NULL,
  "due_date" text NOT NULL,
  "note" text NOT NULL DEFAULT '',
  "status" text NOT NULL DEFAULT 'aktif',
  "reminder_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS "debts_workspace_status_idx" ON "debts" ("workspace_id", "status");
