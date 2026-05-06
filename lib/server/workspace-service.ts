import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { debtPayments, products, transactionItems, transactions, workspaces } from "@/lib/db/schema";
import { createSeedData } from "@/lib/mock-data";
import { HttpError } from "@/lib/server/errors";
import type {
  BootstrapData,
  CreateDebtPaymentInput,
  CreateTransactionInput,
  DebtPayment,
  PaymentMethod,
  Product,
  ProductInput,
  StoreProfile,
  StoreSettings,
  Transaction,
  TransactionItem,
} from "@/lib/types";
import { createId } from "@/lib/utils";
import type { SessionUser } from "@/lib/server/session";

type WorkspaceRow = typeof workspaces.$inferSelect;
type ProductRow = typeof products.$inferSelect;
type TransactionRow = typeof transactions.$inferSelect;
type TransactionItemRow = typeof transactionItems.$inferSelect;
type DebtPaymentRow = typeof debtPayments.$inferSelect;

type WorkspaceSetupInput = {
  storeName?: string;
  ownerName?: string;
  phone?: string;
  address?: string;
};

function formatWorkspaceProfile(row: WorkspaceRow): StoreProfile {
  return {
    name: row.name,
    ownerName: row.ownerName,
    address: row.address,
    phone: row.phone,
  };
}

function formatWorkspaceSettings(row: WorkspaceRow): StoreSettings {
  return {
    enabledPaymentMethods: row.enabledPaymentMethods as PaymentMethod[],
    defaultMinimumStock: row.defaultMinimumStock,
  };
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    buyPrice: row.buyPrice,
    sellPrice: row.sellPrice,
    stock: row.stock,
    minimumStock: row.minimumStock,
    image: row.image ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toDebtPayment(row: DebtPaymentRow): DebtPayment {
  return {
    id: row.id,
    transactionId: row.transactionId,
    amount: row.amount,
    method: row.method as PaymentMethod,
    createdAt: row.createdAt,
  };
}

function buildTransactionList(rows: TransactionRow[], items: TransactionItemRow[]): Transaction[] {
  const itemMap = new Map<string, TransactionItem[]>();

  for (const item of items) {
    const current = itemMap.get(item.transactionId) ?? [];
    current.push({
      productId: item.productId,
      productName: item.productName,
      buyPrice: item.buyPrice,
      sellPrice: item.sellPrice,
      qty: item.qty,
      subtotal: item.subtotal,
    });
    itemMap.set(item.transactionId, current);
  }

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    paymentMethod: row.paymentMethod,
    status: row.status,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    dueDate: row.dueDate,
    total: row.total,
    items: itemMap.get(row.id) ?? [],
  }));
}

async function getWorkspaceByUserId(userId: string) {
  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.ownerUserId, userId)).limit(1);
  return workspace ?? null;
}

async function seedWorkspace(workspace: WorkspaceRow) {
  const seed = createSeedData();
  const productIdMap = new Map<string, string>();

  const productRows = seed.products.map((product) => {
    const id = `${workspace.id}-${product.id}`;
    productIdMap.set(product.id, id);
    return {
      id,
      workspaceId: workspace.id,
      name: product.name,
      category: product.category,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      stock: product.stock,
      minimumStock: product.minimumStock,
      image: product.image ?? null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  });

  const transactionRows = seed.transactions.map((transaction) => ({
    id: `${workspace.id}-${transaction.id}`,
    workspaceId: workspace.id,
    paymentMethod: transaction.paymentMethod,
    status: transaction.status ?? "PAID",
    customerName: transaction.customerName ?? null,
    customerPhone: transaction.customerPhone ?? null,
    dueDate: transaction.dueDate ?? null,
    total: transaction.total,
    createdAt: transaction.createdAt,
  }));

  const itemRows = seed.transactions.flatMap((transaction) =>
    transaction.items.map((item) => ({
      id: createId("item"),
      transactionId: `${workspace.id}-${transaction.id}`,
      productId: productIdMap.get(item.productId) ?? `${workspace.id}-${item.productId}`,
      productName: item.productName,
      buyPrice: item.buyPrice,
      sellPrice: item.sellPrice,
      qty: item.qty,
      subtotal: item.subtotal,
    })),
  );

  const debtPaymentRows = seed.debtPayments.map((dp) => ({
    id: `${workspace.id}-${dp.id}`,
    workspaceId: workspace.id,
    transactionId: `${workspace.id}-${dp.transactionId}`,
    amount: dp.amount,
    method: dp.method,
    createdAt: dp.createdAt,
  }));

  await db.transaction(async (tx) => {
    if (productRows.length) {
      await tx.insert(products).values(productRows);
    }

    if (transactionRows.length) {
      await tx.insert(transactions).values(transactionRows);
    }

    if (itemRows.length) {
      await tx.insert(transactionItems).values(itemRows);
    }

    if (debtPaymentRows.length) {
      await tx.insert(debtPayments).values(debtPaymentRows);
    }
  });
}

async function ensureWorkspace(user: SessionUser, setup?: WorkspaceSetupInput) {
  const existing = await getWorkspaceByUserId(user.id);

  if (existing) {
    if (!setup) {
      return existing;
    }

    const [updated] = await db
      .update(workspaces)
      .set({
        name: setup.storeName?.trim() || existing.name,
        ownerName: setup.ownerName?.trim() || existing.ownerName,
        phone: setup.phone?.trim() ?? existing.phone,
        address: setup.address?.trim() ?? existing.address,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(workspaces.id, existing.id))
      .returning();

    return updated ?? existing;
  }

  const seed = createSeedData();
  const now = new Date().toISOString();
  const workspace = {
    id: createId("ws"),
    ownerUserId: user.id,
    name: setup?.storeName?.trim() || seed.profile.name,
    ownerName: setup?.ownerName?.trim() || user.name?.trim() || seed.profile.ownerName,
    address: setup?.address?.trim() || seed.profile.address,
    phone: setup?.phone?.trim() || seed.profile.phone,
    enabledPaymentMethods: seed.settings.enabledPaymentMethods,
    defaultMinimumStock: seed.settings.defaultMinimumStock,
    createdAt: now,
    updatedAt: now,
  };

  const [created] = await db.insert(workspaces).values(workspace).returning();
  await seedWorkspace(created);
  return created;
}

async function getWorkspaceProducts(workspaceId: string) {
  const rows = await db.select().from(products).where(eq(products.workspaceId, workspaceId)).orderBy(desc(products.createdAt));
  return rows.map(toProduct);
}

async function getWorkspaceDebtPayments(workspaceId: string) {
  const rows = await db.select().from(debtPayments).where(eq(debtPayments.workspaceId, workspaceId)).orderBy(desc(debtPayments.createdAt));
  return rows.map(toDebtPayment);
}

async function getWorkspaceTransactions(workspaceId: string) {
  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.workspaceId, workspaceId))
    .orderBy(desc(transactions.createdAt));

  if (!rows.length) {
    return [] as Transaction[];
  }

  const items = await db
    .select()
    .from(transactionItems)
    .where(
      inArray(
        transactionItems.transactionId,
        rows.map((row) => row.id),
      ),
    )
    .orderBy(asc(transactionItems.transactionId));

  return buildTransactionList(rows, items);
}

export async function getBootstrapData(user: SessionUser): Promise<BootstrapData> {
  const workspace = await ensureWorkspace(user);
  const [allProducts, allTransactions, allDebtPayments] = await Promise.all([
    getWorkspaceProducts(workspace.id),
    getWorkspaceTransactions(workspace.id),
    getWorkspaceDebtPayments(workspace.id),
  ]);

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
    },
    profile: formatWorkspaceProfile(workspace),
    settings: formatWorkspaceSettings(workspace),
    products: allProducts,
    transactions: allTransactions,
    debtPayments: allDebtPayments,
  };
}

export async function setupWorkspace(user: SessionUser, input: WorkspaceSetupInput) {
  await ensureWorkspace(user, input);
  return getBootstrapData(user);
}

export async function createTransactionForUser(user: SessionUser, input: CreateTransactionInput) {
  const workspace = await ensureWorkspace(user);

  if (!input.items.length) {
    throw new HttpError(400, "Keranjang masih kosong.");
  }

  const requestedIds = input.items.map((item) => item.productId);
  const productRows = await db
    .select()
    .from(products)
    .where(and(eq(products.workspaceId, workspace.id), inArray(products.id, requestedIds)));

  const productMap = new Map(productRows.map((product) => [product.id, product]));

  const normalizedItems = input.items.map((item) => {
    const product = productMap.get(item.productId);

    if (!product) {
      throw new HttpError(404, "Produk tidak ditemukan.");
    }

    if (item.qty <= 0) {
      throw new HttpError(400, `Jumlah untuk ${product.name} tidak valid.`);
    }

    if (product.stock < item.qty) {
      throw new HttpError(400, `Stok ${product.name} tidak cukup.`);
    }

    return {
      product,
      qty: item.qty,
      subtotal: product.sellPrice * item.qty,
    };
  });

  const transactionId = createId("trx");
  const now = new Date().toISOString();
  const total = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);

  await db.transaction(async (tx) => {
    for (const item of normalizedItems) {
      await tx
        .update(products)
        .set({
          stock: item.product.stock - item.qty,
          updatedAt: now,
        })
        .where(eq(products.id, item.product.id));
    }

    await tx.insert(transactions).values({
      id: transactionId,
      workspaceId: workspace.id,
      paymentMethod: input.paymentMethod,
      status: input.paymentMethod === "Hutang" ? "UNPAID" : "PAID",
      customerName: input.customerName ?? null,
      customerPhone: input.customerPhone ?? null,
      dueDate: input.dueDate ?? null,
      total,
      createdAt: now,
    });

    await tx.insert(transactionItems).values(
      normalizedItems.map((item) => ({
        id: createId("item"),
        transactionId,
        productId: item.product.id,
        productName: item.product.name,
        buyPrice: item.product.buyPrice,
        sellPrice: item.product.sellPrice,
        qty: item.qty,
        subtotal: item.subtotal,
      })),
    );
  });

  return {
    id: transactionId,
    createdAt: now,
    paymentMethod: input.paymentMethod,
    status: input.paymentMethod === "Hutang" ? "UNPAID" : "PAID",
    customerName: input.customerName ?? null,
    customerPhone: input.customerPhone ?? null,
    dueDate: input.dueDate ?? null,
    total,
    items: normalizedItems.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      buyPrice: item.product.buyPrice,
      sellPrice: item.product.sellPrice,
      qty: item.qty,
      subtotal: item.subtotal,
    })),
  } satisfies Transaction;
}

export async function createProductForUser(user: SessionUser, input: ProductInput) {
  const workspace = await ensureWorkspace(user);

  if (!input.name.trim()) {
    throw new HttpError(400, "Nama produk wajib diisi.");
  }

  if (input.sellPrice <= 0 || input.buyPrice < 0) {
    throw new HttpError(400, "Harga produk tidak valid.");
  }

  const now = new Date().toISOString();
  await db.insert(products).values({
    id: createId("prd"),
    workspaceId: workspace.id,
    name: input.name.trim(),
    category: input.category.trim() || "Lainnya",
    buyPrice: input.buyPrice,
    sellPrice: input.sellPrice,
    stock: Math.max(0, input.stock),
    minimumStock: Math.max(0, input.minimumStock),
    image: null,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateProductForUser(user: SessionUser, productId: string, input: ProductInput) {
  const workspace = await ensureWorkspace(user);

  if (!input.name.trim()) {
    throw new HttpError(400, "Nama produk wajib diisi.");
  }

  if (input.sellPrice <= 0 || input.buyPrice < 0) {
    throw new HttpError(400, "Harga produk tidak valid.");
  }

  const [updated] = await db
    .update(products)
    .set({
      name: input.name.trim(),
      category: input.category.trim() || "Lainnya",
      buyPrice: input.buyPrice,
      sellPrice: input.sellPrice,
      stock: Math.max(0, input.stock),
      minimumStock: Math.max(0, input.minimumStock),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(products.id, productId), eq(products.workspaceId, workspace.id)))
    .returning();

  if (!updated) {
    throw new HttpError(404, "Produk tidak ditemukan.");
  }
}

export async function restockProductForUser(user: SessionUser, productId: string, qty: number) {
  const workspace = await ensureWorkspace(user);

  if (qty <= 0) {
    throw new HttpError(400, "Jumlah restock harus lebih dari 0.");
  }

  const [updated] = await db
    .update(products)
    .set({
      stock: sql`${products.stock} + ${qty}`,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(products.id, productId), eq(products.workspaceId, workspace.id)))
    .returning();

  if (!updated) {
    throw new HttpError(404, "Produk tidak ditemukan.");
  }
}

export async function createDebtPaymentForUser(user: SessionUser, input: CreateDebtPaymentInput) {
  const workspace = await ensureWorkspace(user);

  if (input.amount <= 0) {
    throw new HttpError(400, "Nominal bayar harus lebih dari 0.");
  }

  const [transaction] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, input.transactionId), eq(transactions.workspaceId, workspace.id)))
    .limit(1);

  if (!transaction || transaction.paymentMethod !== "Hutang") {
    throw new HttpError(404, "Transaksi hutang tidak ditemukan.");
  }

  const existingPayments = await db
    .select()
    .from(debtPayments)
    .where(eq(debtPayments.transactionId, input.transactionId));

  const totalPaid = existingPayments.reduce((sum, dp) => sum + dp.amount, 0);
  const remaining = transaction.total - totalPaid;

  if (input.amount > remaining) {
    throw new HttpError(400, "Nominal bayar melebihi sisa hutang.");
  }

  const now = new Date().toISOString();

  await db.transaction(async (tx) => {
    await tx.insert(debtPayments).values({
      id: createId("dp"),
      workspaceId: workspace.id,
      transactionId: input.transactionId,
      amount: input.amount,
      method: input.method,
      createdAt: now,
    });

    if (totalPaid + input.amount >= transaction.total) {
      await tx
        .update(transactions)
        .set({ status: "PAID" })
        .where(eq(transactions.id, input.transactionId));
    }
  });
}

export async function updateSettingsForUser(
  user: SessionUser,
  input: { profile: StoreProfile; settings: StoreSettings },
) {
  const workspace = await ensureWorkspace(user);

  const [updated] = await db
    .update(workspaces)
    .set({
      name: input.profile.name.trim(),
      ownerName: input.profile.ownerName.trim(),
      address: input.profile.address.trim(),
      phone: input.profile.phone.trim(),
      enabledPaymentMethods: input.settings.enabledPaymentMethods,
      defaultMinimumStock: Math.max(0, input.settings.defaultMinimumStock),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(workspaces.id, workspace.id))
    .returning();

  return updated;
}

export async function resetWorkspaceForUser(user: SessionUser) {
  const workspace = await ensureWorkspace(user);
  const seed = createSeedData();

  await db.transaction(async (tx) => {
    await tx.delete(debtPayments).where(eq(debtPayments.workspaceId, workspace.id));
    await tx.delete(transactions).where(eq(transactions.workspaceId, workspace.id));
    await tx.delete(products).where(eq(products.workspaceId, workspace.id));

    await tx
      .update(workspaces)
      .set({
        enabledPaymentMethods: seed.settings.enabledPaymentMethods,
        defaultMinimumStock: seed.settings.defaultMinimumStock,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(workspaces.id, workspace.id));
  });

  const refreshedWorkspace = (await getWorkspaceByUserId(user.id)) ?? workspace;
  await seedWorkspace(refreshedWorkspace);
  return getBootstrapData(user);
}
