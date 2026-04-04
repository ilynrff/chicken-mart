import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

if (existsSync(".env.local")) {
  config({ path: ".env.local" });
}

config();

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/*schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/chicken_mart",
  },
  strict: true,
  verbose: true,
});
