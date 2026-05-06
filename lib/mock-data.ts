import type { BootstrapData, DebtPayment, Product, Transaction } from "@/lib/types";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

const products: Product[] = [
  {
    id: "prd-1",
    name: "Beras Ramos 5kg",
    category: "Sembako",
    buyPrice: 68000,
    sellPrice: 76000,
    stock: 12,
    minimumStock: 6,
    createdAt: daysAgo(12),
    updatedAt: hoursAgo(3),
  },
  {
    id: "prd-2",
    name: "Minyak Goreng 1L",
    category: "Sembako",
    buyPrice: 17000,
    sellPrice: 19500,
    stock: 9,
    minimumStock: 10,
    createdAt: daysAgo(10),
    updatedAt: hoursAgo(6),
  },
  {
    id: "prd-3",
    name: "Nugget Ayam 500gr",
    category: "Frozen Food",
    buyPrice: 24500,
    sellPrice: 29500,
    stock: 14,
    minimumStock: 8,
    createdAt: daysAgo(9),
    updatedAt: hoursAgo(1),
  },
  {
    id: "prd-4",
    name: "Sosis Sapi 375gr",
    category: "Frozen Food",
    buyPrice: 18000,
    sellPrice: 22500,
    stock: 11,
    minimumStock: 7,
    createdAt: daysAgo(8),
    updatedAt: hoursAgo(7),
  },
  {
    id: "prd-5",
    name: "Mie Instan Goreng",
    category: "Makanan Kering",
    buyPrice: 2800,
    sellPrice: 3500,
    stock: 42,
    minimumStock: 20,
    createdAt: daysAgo(6),
    updatedAt: hoursAgo(2),
  },
  {
    id: "prd-6",
    name: "Susu UHT Cokelat 1L",
    category: "Minuman",
    buyPrice: 16000,
    sellPrice: 19500,
    stock: 6,
    minimumStock: 8,
    createdAt: daysAgo(4),
    updatedAt: hoursAgo(4),
  },
];

const transactions: Transaction[] = [
  {
    id: "trx-1",
    createdAt: hoursAgo(1),
    paymentMethod: "QRIS",
    status: "PAID",
    customerName: null,
    customerPhone: null,
    dueDate: null,
    total: 83000,
    items: [
      {
        productId: "prd-1",
        productName: "Beras Ramos 5kg",
        buyPrice: 68000,
        sellPrice: 76000,
        qty: 1,
        subtotal: 76000,
      },
      {
        productId: "prd-5",
        productName: "Mie Instan Goreng",
        buyPrice: 2800,
        sellPrice: 3500,
        qty: 2,
        subtotal: 7000,
      },
    ],
  },
  {
    id: "trx-2",
    createdAt: hoursAgo(5),
    paymentMethod: "Tunai",
    status: "PAID",
    customerName: null,
    customerPhone: null,
    dueDate: null,
    total: 71500,
    items: [
      {
        productId: "prd-3",
        productName: "Nugget Ayam 500gr",
        buyPrice: 24500,
        sellPrice: 29500,
        qty: 1,
        subtotal: 29500,
      },
      {
        productId: "prd-4",
        productName: "Sosis Sapi 375gr",
        buyPrice: 18000,
        sellPrice: 22500,
        qty: 1,
        subtotal: 22500,
      },
      {
        productId: "prd-6",
        productName: "Susu UHT Cokelat 1L",
        buyPrice: 16000,
        sellPrice: 19500,
        qty: 1,
        subtotal: 19500,
      },
    ],
  },
  {
    id: "trx-3",
    createdAt: daysAgo(1),
    paymentMethod: "Transfer",
    status: "PAID",
    customerName: null,
    customerPhone: null,
    dueDate: null,
    total: 49500,
    items: [
      {
        productId: "prd-2",
        productName: "Minyak Goreng 1L",
        buyPrice: 17000,
        sellPrice: 19500,
        qty: 2,
        subtotal: 39000,
      },
      {
        productId: "prd-5",
        productName: "Mie Instan Goreng",
        buyPrice: 2800,
        sellPrice: 3500,
        qty: 3,
        subtotal: 10500,
      },
    ],
  },
  {
    id: "trx-4",
    createdAt: daysAgo(3),
    paymentMethod: "Tunai",
    status: "PAID",
    customerName: null,
    customerPhone: null,
    dueDate: null,
    total: 49000,
    items: [
      {
        productId: "prd-3",
        productName: "Nugget Ayam 500gr",
        buyPrice: 24500,
        sellPrice: 29500,
        qty: 1,
        subtotal: 29500,
      },
      {
        productId: "prd-2",
        productName: "Minyak Goreng 1L",
        buyPrice: 17000,
        sellPrice: 19500,
        qty: 1,
        subtotal: 19500,
      },
    ],
  },
  {
    id: "trx-5",
    createdAt: daysAgo(2),
    paymentMethod: "Hutang",
    status: "UNPAID",
    customerName: "Pak Dodi",
    customerPhone: "081234567890",
    dueDate: daysAgo(-2),
    total: 65000,
    items: [
      {
        productId: "prd-1",
        productName: "Beras Ramos 5kg",
        buyPrice: 68000,
        sellPrice: 76000,
        qty: 1,
        subtotal: 76000,
      }
    ],
  },
  {
    id: "trx-6",
    createdAt: daysAgo(8),
    paymentMethod: "Hutang",
    status: "PAID",
    customerName: "Bu Rina",
    customerPhone: "081998877665",
    dueDate: daysAgo(5),
    total: 28000,
    items: [
      {
        productId: "prd-4",
        productName: "Sosis Sapi 375gr",
        buyPrice: 18000,
        sellPrice: 22500,
        qty: 1,
        subtotal: 22500,
      }
    ],
  },
];

const debtPayments: DebtPayment[] = [
  {
    id: "dp-1",
    transactionId: "trx-6",
    amount: 28000,
    method: "Tunai",
    createdAt: daysAgo(4),
  }
];

export function createSeedData(): BootstrapData {
  return {
    workspace: {
      id: "ws-chicken-mart",
      name: "Chicken Mart",
    },
    profile: {
      name: "Chicken Mart",
      ownerName: "Ibu Sari",
      address: "Jl. Melati No. 18, Jakarta Timur",
      phone: "081212341234",
    },
    settings: {
      enabledPaymentMethods: ["Tunai", "QRIS", "Transfer", "Hutang"],
      defaultMinimumStock: 8,
    },
    products,
    transactions,
    debtPayments,
  };
}
