export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/chicken_mart",
  betterAuthSecret:
    process.env.BETTER_AUTH_SECRET ?? "dev-secret-please-change-this-before-production-123456789",
  betterAuthUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
};
