import type {
  BootstrapData,
  DashboardMetrics,
  ReportPeriod,
  ReportSummary,
  SoldProductDetail,
  TopProduct,
  Transaction,
} from "@/lib/types";
import { formatCurrency, formatNumber, startOfDay } from "@/lib/utils";

type ReportSummaryOptions = {
  dateFrom?: string | null;
  dateTo?: string | null;
};

function endOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function getPeriodBounds(period: ReportPeriod) {
  const now = new Date();
  const to = endOfDay(now);

  if (period === "harian") {
    return {
      from: startOfDay(now),
      to,
      label: "Hari ini",
    };
  }

  if (period === "mingguan") {
    const from = startOfDay(now);
    from.setDate(from.getDate() - 6);

    return {
      from,
      to,
      label: "7 hari terakhir",
    };
  }

  const from = startOfDay(now);
  from.setDate(from.getDate() - 29);

  return {
    from,
    to,
    label: "30 hari terakhir",
  };
}

function normalizeInputDate(value?: string | null, isEndOfDay = false) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (isEndOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

function resolveDateRange(period: ReportPeriod, options?: ReportSummaryOptions) {
  const defaultRange = getPeriodBounds(period);
  const customFrom = normalizeInputDate(options?.dateFrom);
  const customTo = normalizeInputDate(options?.dateTo, true);

  if (!customFrom && !customTo) {
    return {
      from: defaultRange.from,
      to: defaultRange.to,
      label: defaultRange.label,
      isCustom: false,
    };
  }

  return {
    from: customFrom ?? defaultRange.from,
    to: customTo ?? defaultRange.to,
    label: "Rentang tanggal dipilih",
    isCustom: true,
  };
}

function isInRange(dateString: string, from: Date, to: Date) {
  const date = new Date(dateString);
  return date >= from && date <= to;
}

function getBucketMeta(date: Date, period: ReportPeriod, isCustom: boolean) {
  if (period === "harian" && !isCustom) {
    return {
      key: date.toISOString().slice(0, 13),
      label: new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date),
      bucketStart: new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).toISOString(),
    };
  }

  return {
    key: date.toISOString().slice(0, 10),
    label: new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
    }).format(date),
    bucketStart: new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString(),
  };
}

export function getDashboardMetrics(data: BootstrapData): DashboardMetrics {
  const todayStart = startOfDay();
  const todayTransactions = data.transactions.filter(
    (transaction) => new Date(transaction.createdAt) >= todayStart,
  );
  const weeklySummary = getReportSummary(data, "mingguan");
  const stokHabis = data.products.filter((product) => product.stock === 0).length;
  const pelangganKasbonAktif = data.transactions.filter((t) => t.paymentMethod === "Hutang" && t.status === "UNPAID").length;
  const avgBelanjaHariIni = todayTransactions.length
    ? todayTransactions.reduce((sum, transaction) => sum + transaction.total, 0) / todayTransactions.length
    : 0;

  return {
    omzetHariIni: todayTransactions.reduce((sum, transaction) => sum + transaction.total, 0),
    transaksiHariIni: todayTransactions.length,
    stokMenipis: data.products.filter((product) => product.stock <= product.minimumStock).length,
    totalKasbon: data.transactions
      .filter((t) => t.paymentMethod === "Hutang" && t.status === "UNPAID")
      .reduce((sum, t) => {
        const paid = data.debtPayments.filter(dp => dp.transactionId === t.id).reduce((s, dp) => s + dp.amount, 0);
        return sum + (t.total - paid);
      }, 0),
    recentTransactions: [...data.transactions]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 5),
    attentionProducts: [...data.products]
      .filter((product) => product.stock <= product.minimumStock)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5),
    avgBelanjaHariIni,
    stokHabis,
    pelangganKasbonAktif,
    omzetMingguBerjalan: weeklySummary.omzet,
    produkTerlarisMinggu: weeklySummary.topProducts[0] ?? null,
    insights: [
      {
        title: "Rata-rata belanja hari ini",
        value: formatCurrency(avgBelanjaHariIni),
        description: todayTransactions.length
          ? "Nilai ini membantu memantau kualitas transaksi yang masuk hari ini."
          : "Belum ada transaksi hari ini, jadi kasir bisa mulai dari promo produk cepat laku.",
        tone: todayTransactions.length ? "positive" : "neutral",
      },
      {
        title: "Produk terlaris minggu ini",
        value: weeklySummary.topProducts[0]
          ? `${weeklySummary.topProducts[0].productName}`
          : "Belum ada data",
        description: weeklySummary.topProducts[0]
          ? `${formatNumber(weeklySummary.topProducts[0].qty)} item terjual dengan omzet ${formatCurrency(weeklySummary.topProducts[0].omzet)}.`
          : "Tambahkan transaksi terlebih dulu untuk melihat produk yang paling diminati pelanggan.",
        tone: weeklySummary.topProducts[0] ? "positive" : "neutral",
      },
      {
        title: "Stok prioritas",
        value: `${formatNumber(stokHabis)} habis / ${formatNumber(
          data.products.filter((product) => product.stock <= product.minimumStock && product.stock > 0).length,
        )} tipis`,
        description:
          stokHabis > 0
            ? "Ada produk yang sudah habis. Prioritaskan restock agar rak tetap aman saat jam ramai."
            : "Belum ada stok habis, tapi produk tipis tetap perlu dipantau sebelum jam sibuk.",
        tone: data.products.some((product) => product.stock <= product.minimumStock) ? "warning" : "positive",
      },
      {
        title: "Kasbon aktif",
        value: `${formatNumber(pelangganKasbonAktif)} pelanggan`,
        description: pelangganKasbonAktif
          ? `Total tagihan aktif saat ini ${formatCurrency(
              data.transactions
                .filter((t) => t.paymentMethod === "Hutang" && t.status === "UNPAID")
                .reduce((sum, t) => {
                  const paid = data.debtPayments.filter(dp => dp.transactionId === t.id).reduce((s, dp) => s + dp.amount, 0);
                  return sum + (t.total - paid);
                }, 0),
            )}.`
          : "Tidak ada kasbon aktif, arus kas warung sedang lebih aman.",
        tone: pelangganKasbonAktif ? "warning" : "positive",
      },
    ],
  };
}

export function getReportSummary(
  data: BootstrapData,
  period: ReportPeriod,
  options?: ReportSummaryOptions,
): ReportSummary {
  const range = resolveDateRange(period, options);
  const filtered = data.transactions.filter((transaction) => isInRange(transaction.createdAt, range.from, range.to));
  const filteredDebtPayments = data.debtPayments.filter((dp) => isInRange(dp.createdAt, range.from, range.to));

  const omzet = filtered.reduce((sum, transaction) => sum + transaction.total, 0);
  const pembayaranHutang = filteredDebtPayments.reduce((sum, dp) => sum + dp.amount, 0);
  
  // Kas Masuk = (Total Omzet - Omzet dari transaksi Hutang) + Pembayaran Hutang
  const penjualanCash = filtered.filter(t => t.paymentMethod !== "Hutang").reduce((sum, t) => sum + t.total, 0);
  const totalKasMasuk = penjualanCash + pembayaranHutang;

  const hpp = filtered.reduce(
    (sum, transaction) =>
      sum +
      transaction.items.reduce((subtotal, item) => subtotal + item.buyPrice * item.qty, 0),
    0,
  );
  const labaKotor = omzet - hpp;
  const labaBersih = labaKotor;
  const jumlahTransaksi = filtered.length;
  const rataRataBelanja = jumlahTransaksi ? omzet / jumlahTransaksi : 0;

  const productMap = new Map<string, TopProduct>();
  const soldProductMap = new Map<string, SoldProductDetail>();
  for (const transaction of filtered) {
    for (const item of transaction.items) {
      const currentTop = productMap.get(item.productId) ?? {
        productName: item.productName,
        qty: 0,
        omzet: 0,
      };

      currentTop.qty += item.qty;
      currentTop.omzet += item.subtotal;
      productMap.set(item.productId, currentTop);

      const currentSold = soldProductMap.get(item.productId) ?? {
        productId: item.productId,
        productName: item.productName,
        sellPrice: item.sellPrice,
        qty: 0,
        omzet: 0,
      };

      currentSold.qty += item.qty;
      currentSold.omzet += item.subtotal;
      soldProductMap.set(item.productId, currentSold);
    }
  }

  const topProducts = [...productMap.values()]
    .sort((a, b) => b.qty - a.qty || b.omzet - a.omzet)
    .slice(0, 5);

  const soldProducts = [...soldProductMap.values()].sort(
    (a, b) => b.qty - a.qty || b.omzet - a.omzet || a.productName.localeCompare(b.productName),
  );

  const bucketMap = new Map<string, { label: string; omzet: number; laba: number; transaksi: number; bucketStart: string }>();
  for (const transaction of filtered) {
    const date = new Date(transaction.createdAt);
    const bucket = getBucketMeta(date, period, range.isCustom);
    const current = bucketMap.get(bucket.key) ?? {
      label: bucket.label,
      omzet: 0,
      laba: 0,
      transaksi: 0,
      bucketStart: bucket.bucketStart,
    };
    const cogs = transaction.items.reduce((sum, item) => sum + item.buyPrice * item.qty, 0);

    current.omzet += transaction.total;
    current.laba += transaction.total - cogs;
    current.transaksi += 1;
    bucketMap.set(bucket.key, current);
  }

  const revenueSeries = [...bucketMap.values()]
    .sort((a, b) => +new Date(a.bucketStart) - +new Date(b.bucketStart))
    .map((values) => ({
      label: values.label,
      omzet: values.omzet,
      laba: values.laba,
      transaksi: values.transaksi,
      bucketStart: values.bucketStart,
    }));

  return {
    period,
    omzet,
    pembayaranHutang,
    totalKasMasuk,
    hpp,
    labaKotor,
    labaBersih,
    jumlahTransaksi,
    rataRataBelanja,
    topProducts,
    soldProducts,
    revenueSeries,
    dateRange: {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      label: range.label,
      isCustom: range.isCustom,
    },
  };
}
