import type {
  BootstrapData,
  CreateDebtInput,
  CreateTransactionInput,
  Debt,
  ProductInput,
  StoreProfile,
  StoreSettings,
  Transaction,
} from "@/lib/types";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(path, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as { message?: string } | T | null;

  if (!response.ok) {
    throw new Error(
      payload && typeof payload === "object" && "message" in payload && payload.message
        ? String(payload.message)
        : "Permintaan ke server gagal.",
    );
  }

  return payload as T;
}

export const api = {
  getBootstrap: () => request<BootstrapData>("/api/bootstrap"),
  setupWorkspace: (input: { storeName?: string; ownerName?: string; phone?: string; address?: string }) =>
    request<BootstrapData>("/api/bootstrap/setup", { method: "POST", body: input }),
  resetWorkspace: () => request<BootstrapData>("/api/bootstrap/reset", { method: "POST" }),
  createTransaction: (input: CreateTransactionInput) =>
    request<Transaction>("/api/transactions", { method: "POST", body: input }),
  createProduct: (input: ProductInput) => request<{ success: true }>("/api/products", { method: "POST", body: input }),
  updateProduct: (id: string, input: ProductInput) =>
    request<{ success: true }>(`/api/products/${id}`, { method: "PATCH", body: input }),
  restockProduct: (id: string, qty: number) =>
    request<{ success: true }>(`/api/products/${id}/restock`, { method: "POST", body: { qty } }),
  createDebt: (input: CreateDebtInput) => request<{ success: true }>("/api/debts", { method: "POST", body: input }),
  updateDebt: (
    id: string,
    input: Partial<Pick<Debt, "status" | "note" | "phone" | "dueDate" | "customerName" | "amount" | "reminderCount">>,
  ) => request<{ success: true }>(`/api/debts/${id}`, { method: "PATCH", body: input }),
  updateSettings: (input: { profile: StoreProfile; settings: StoreSettings }) =>
    request<{ success: true }>("/api/settings", { method: "PATCH", body: input }),
};
