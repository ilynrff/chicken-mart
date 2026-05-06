export type PaymentMethod = "Tunai" | "QRIS" | "Transfer" | "Hutang";
export type ReportPeriod = "harian" | "mingguan" | "bulanan";

export type Workspace = {
  id: string;
  name: string;
};

export type StoreProfile = {
  name: string;
  ownerName: string;
  address: string;
  phone: string;
};

export type StoreSettings = {
  enabledPaymentMethods: PaymentMethod[];
  defaultMinimumStock: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minimumStock: number;
  image?: string;
  createdAt: string;
  updatedAt: string;
};

export type TransactionItem = {
  productId: string;
  productName: string;
  buyPrice: number;
  sellPrice: number;
  qty: number;
  subtotal: number;
};

export type Transaction = {
  id: string;
  createdAt: string;
  paymentMethod: PaymentMethod;
  status: "PAID" | "UNPAID";
  customerName: string | null;
  customerPhone: string | null;
  dueDate: string | null;
  total: number;
  items: TransactionItem[];
};

export type DebtPayment = {
  id: string;
  transactionId: string;
  amount: number;
  method: PaymentMethod;
  createdAt: string;
};

export type CartItem = {
  productId: string;
  qty: number;
};

export type RevenuePoint = {
  label: string;
  omzet: number;
  laba: number;
  transaksi: number;
  bucketStart: string;
};

export type TopProduct = {
  productName: string;
  qty: number;
  omzet: number;
};

export type SoldProductDetail = {
  productId: string;
  productName: string;
  sellPrice: number;
  qty: number;
  omzet: number;
};

export type ReportDateRange = {
  from: string | null;
  to: string | null;
  label: string;
  isCustom: boolean;
};

export type ReportSummary = {
  period: ReportPeriod;
  omzet: number;
  pembayaranHutang: number;
  totalKasMasuk: number;
  hpp: number;
  labaKotor: number;
  labaBersih: number;
  jumlahTransaksi: number;
  rataRataBelanja: number;
  topProducts: TopProduct[];
  soldProducts: SoldProductDetail[];
  revenueSeries: RevenuePoint[];
  dateRange: ReportDateRange;
};

export type BootstrapData = {
  workspace: Workspace;
  profile: StoreProfile;
  settings: StoreSettings;
  products: Product[];
  transactions: Transaction[];
  debtPayments: DebtPayment[];
};

export type ProductInput = {
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minimumStock: number;
};

export type CreateTransactionInput = {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  dueDate?: string;
};

export type CreateDebtPaymentInput = {
  transactionId: string;
  amount: number;
  method: PaymentMethod;
};

export type DashboardInsightTone = "positive" | "warning" | "neutral";

export type DashboardInsight = {
  title: string;
  value: string;
  description: string;
  tone: DashboardInsightTone;
};

export type DashboardMetrics = {
  omzetHariIni: number;
  transaksiHariIni: number;
  stokMenipis: number;
  totalKasbon: number;
  recentTransactions: Transaction[];
  attentionProducts: Product[];
  avgBelanjaHariIni: number;
  stokHabis: number;
  pelangganKasbonAktif: number;
  omzetMingguBerjalan: number;
  produkTerlarisMinggu: TopProduct | null;
  insights: DashboardInsight[];
};
