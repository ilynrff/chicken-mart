import { createSeedData } from "@/lib/mock-data";
import type {
  BootstrapData,
  Category,
  CategoryInput,
  CreateDebtPaymentInput,
  CreateTransactionInput,
  DebtPayment,
  Product,
  ProductInput,
  StoreProfile,
  StoreSettings,
  Transaction,
} from "@/lib/types";
import { createId } from "@/lib/utils";

const STORAGE_KEY = "chicken-mart-bootstrap-retail-v2";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function wait(ms = 180) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readState(): BootstrapData {
  if (typeof window === "undefined") {
    return createSeedData();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = createSeedData();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  const parsed = JSON.parse(raw) as BootstrapData;
  if (!parsed.categories) {
    parsed.categories = [
      { id: "cat-1", name: "Sembako" },
      { id: "cat-2", name: "Frozen Food" },
      { id: "cat-3", name: "Makanan Kering" },
      { id: "cat-4", name: "Minuman" },
      { id: "cat-5", name: "Kebutuhan Rumah Tangga" },
      { id: "cat-6", name: "Lainnya" },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  }
  return parsed;
}

function writeState(next: BootstrapData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function ensureProduct(state: BootstrapData, productId: string): Product {
  const product = state.products.find((item) => item.id === productId);
  if (!product) {
    throw new Error("Produk tidak ditemukan.");
  }

  return product;
}

export const mockApi = {
  async getBootstrap() {
    await wait();
    return clone(readState());
  },

  async createTransaction(input: CreateTransactionInput) {
    await wait(240);
    const state = readState();

    if (!input.items.length) {
      throw new Error("Keranjang masih kosong.");
    }

    const transactionItems = input.items.map((item) => {
      const product = ensureProduct(state, item.productId);

      if (item.qty <= 0) {
        throw new Error(`Jumlah untuk ${product.name} tidak valid.`);
      }

      if (product.stock < item.qty) {
        throw new Error(`Stok ${product.name} tidak cukup.`);
      }

      return {
        productId: product.id,
        productName: product.name,
        buyPrice: product.buyPrice,
        sellPrice: product.sellPrice,
        qty: item.qty,
        subtotal: item.qty * product.sellPrice,
      };
    });

    const transaction: Transaction = {
      id: createId("trx"),
      createdAt: new Date().toISOString(),
      paymentMethod: input.paymentMethod,
      status: input.paymentMethod === "Hutang" ? "UNPAID" : "PAID",
      customerName: input.customerName ?? null,
      customerPhone: input.customerPhone ?? null,
      dueDate: input.dueDate ?? null,
      total: transactionItems.reduce((sum, item) => sum + item.subtotal, 0),
      items: transactionItems,
    };

    const nextState: BootstrapData = {
      ...state,
      products: state.products.map((product) => {
        const item = input.items.find((entry) => entry.productId === product.id);
        if (!item) {
          return product;
        }

        return {
          ...product,
          stock: product.stock - item.qty,
          updatedAt: new Date().toISOString(),
        };
      }),
      transactions: [transaction, ...state.transactions],
    };

    writeState(nextState);
    return clone(transaction);
  },

  async createProduct(input: ProductInput) {
    await wait();
    const state = readState();

    if (!input.name.trim()) {
      throw new Error("Nama produk wajib diisi.");
    }

    if (input.sellPrice <= 0 || input.buyPrice < 0) {
      throw new Error("Harga produk tidak valid.");
    }

    const now = new Date().toISOString();
    const product: Product = {
      id: createId("prd"),
      name: input.name.trim(),
      category: input.category.trim() || "Lainnya",
      buyPrice: input.buyPrice,
      sellPrice: input.sellPrice,
      stock: Math.max(0, input.stock),
      minimumStock: Math.max(0, input.minimumStock),
      createdAt: now,
      updatedAt: now,
    };

    const nextState = {
      ...state,
      products: [product, ...state.products],
    };

    writeState(nextState);
    return clone(product);
  },

  async updateProduct(id: string, input: ProductInput) {
    await wait();
    const state = readState();
    let found = false;

    if (!input.name.trim()) {
      throw new Error("Nama produk wajib diisi.");
    }

    if (input.sellPrice <= 0 || input.buyPrice < 0) {
      throw new Error("Harga produk tidak valid.");
    }

    const nextState = {
      ...state,
      products: state.products.map((product) => {
        if (product.id !== id) {
          return product;
        }

        found = true;
        return {
          ...product,
          ...input,
          stock: Math.max(0, input.stock),
          minimumStock: Math.max(0, input.minimumStock),
          updatedAt: new Date().toISOString(),
        };
      }),
    };

    if (!found) {
      throw new Error("Produk tidak ditemukan.");
    }

    writeState(nextState);
  },

  async restockProduct(id: string, qty: number) {
    await wait();
    const state = readState();

    if (qty <= 0) {
      throw new Error("Jumlah restock harus lebih dari 0.");
    }

    let found = false;
    const nextState = {
      ...state,
      products: state.products.map((product) => {
        if (product.id !== id) {
          return product;
        }

        found = true;
        return {
          ...product,
          stock: product.stock + qty,
          updatedAt: new Date().toISOString(),
        };
      }),
    };

    if (!found) {
      throw new Error("Produk tidak ditemukan.");
    }

    writeState(nextState);
  },

  async createDebtPayment(input: CreateDebtPaymentInput) {
    await wait();
    const state = readState();

    if (input.amount <= 0) {
      throw new Error("Nominal bayar harus lebih dari 0.");
    }

    const transactionIndex = state.transactions.findIndex((t) => t.id === input.transactionId);
    if (transactionIndex === -1 || state.transactions[transactionIndex].paymentMethod !== "Hutang") {
      throw new Error("Transaksi hutang tidak ditemukan.");
    }

    const transaction = state.transactions[transactionIndex];
    const existingPayments = state.debtPayments.filter((dp) => dp.transactionId === input.transactionId);
    const totalPaid = existingPayments.reduce((sum, dp) => sum + dp.amount, 0);
    const remaining = transaction.total - totalPaid;

    if (input.amount > remaining) {
      throw new Error("Nominal bayar melebihi sisa hutang.");
    }

    const dp: DebtPayment = {
      id: createId("dp"),
      transactionId: input.transactionId,
      amount: input.amount,
      method: input.method,
      createdAt: new Date().toISOString(),
    };

    const nextState = {
      ...state,
      debtPayments: [dp, ...state.debtPayments],
    };

    if (totalPaid + input.amount >= transaction.total) {
      nextState.transactions = [...state.transactions];
      nextState.transactions[transactionIndex] = {
        ...transaction,
        status: "PAID",
      };
    }

    writeState(nextState);
  },

  async updateSettings(input: { profile: StoreProfile; settings: StoreSettings }) {
    await wait();
    const state = readState();

    const nextState = {
      ...state,
      profile: input.profile,
      settings: input.settings,
    };

    writeState(nextState);
  },

  async createCategory(input: CategoryInput) {
    await wait();
    const state = readState();
    
    if (!input.name.trim()) {
      throw new Error("Nama kategori wajib diisi.");
    }

    const category: Category = {
      id: createId("cat"),
      name: input.name.trim(),
      color: input.color,
      icon: input.icon,
    };

    const nextState = {
      ...state,
      categories: [...state.categories, category],
    };

    writeState(nextState);
    return clone(category);
  },

  async updateCategory(id: string, input: CategoryInput) {
    await wait();
    const state = readState();

    if (!input.name.trim()) {
      throw new Error("Nama kategori wajib diisi.");
    }

    const nextState = {
      ...state,
      categories: state.categories.map((c) => (c.id === id ? { ...c, ...input, name: input.name.trim() } : c)),
      products: state.products.map((p) => {
        const oldCategory = state.categories.find(c => c.id === id);
        if (p.category === oldCategory?.name) {
          return { ...p, category: input.name.trim() };
        }
        return p;
      }),
    };

    writeState(nextState);
  },

  async deleteCategory(id: string) {
    await wait();
    const state = readState();
    const category = state.categories.find(c => c.id === id);
    
    if (!category) {
      throw new Error("Kategori tidak ditemukan.");
    }

    const isUsed = state.products.some(p => p.category === category.name);
    if (isUsed) {
      throw new Error("Kategori tidak bisa dihapus karena masih digunakan oleh produk.");
    }

    const nextState = {
      ...state,
      categories: state.categories.filter(c => c.id !== id),
    };

    writeState(nextState);
  },

  async resetWorkspace() {
    await wait(250);
    const seeded = createSeedData();
    writeState(seeded);
    return clone(seeded);
  },
};
