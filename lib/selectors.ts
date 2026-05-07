import type {
  BootstrapData,
  DashboardMetrics,
  ReportPeriod,
  ReportSummary,
  SoldProductDetail,
  TopProduct,
  Transaction,
} from "@/lib/types";
import { formatCurrency, formatNumber, isToday, startOfDay } from "@/lib/utils";

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

  const todayDebtPayments = data.debtPayments.filter((dp) => isToday(dp.createdAt));
  const omzetHariIni = todayTransactions.reduce((sum, t) => sum + t.total, 0);
  const kasMasukHariIni = todayTransactions.filter(t => t.paymentMethod !== "Hutang").reduce((sum, t) => sum + t.total, 0)
                        + todayDebtPayments.reduce((sum, dp) => sum + dp.amount, 0);

  const avgBelanjaHariIni = todayTransactions.length
    ? omzetHariIni / todayTransactions.length
    : 0;

  return {
    omzetHariIni,
    kasMasukHariIni,
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

  const diffMs = range.to.getTime() - range.from.getTime();
  const prevFrom = new Date(range.from.getTime() - diffMs - 1);
  const prevTo = new Date(range.from.getTime() - 1);

  const omzet = filtered.reduce((sum, transaction) => sum + transaction.total, 0);
  const pembayaranHutang = filteredDebtPayments.reduce((sum, dp) => sum + dp.amount, 0);

  let trend: "up" | "down" | "neutral" = "neutral";
  let percentage = 0;
  const prevFiltered = data.transactions.filter((t) => isInRange(t.createdAt, prevFrom, prevTo));
  const prevOmzet = prevFiltered.reduce((sum, t) => sum + t.total, 0);
  
  if (prevOmzet > 0) {
    percentage = ((omzet - prevOmzet) / prevOmzet) * 100;
    if (percentage > 0.1) trend = "up";
    else if (percentage < -0.1) trend = "down";
  } else if (omzet > 0) {
    percentage = 100;
    trend = "up";
  }

  const omzetComparison = {
    trend,
    percentage: Math.abs(percentage),
  };
  
  // Kas Masuk = (Total Omzet - Omzet dari transaksi Hutang) + Pembayaran Hutang
  const penjualanCash = filtered.filter(t => t.paymentMethod !== "Hutang").reduce((sum, t) => sum + t.total, 0);
  const totalKasMasuk = penjualanCash + pembayaranHutang;

  const piutangAktif = filtered.filter(t => t.paymentMethod === "Hutang").reduce((sum, t) => {
    const paid = data.debtPayments.filter(dp => dp.transactionId === t.id).reduce((s, dp) => s + dp.amount, 0);
    return sum + (t.total - paid);
  }, 0);

  const kasTunai = filtered.filter(t => t.paymentMethod === "Tunai").reduce((sum, t) => sum + t.total, 0) 
                 + filteredDebtPayments.filter(dp => dp.method === "Tunai").reduce((sum, dp) => sum + dp.amount, 0);
  
  const uangDigital = filtered.filter(t => t.paymentMethod === "QRIS" || t.paymentMethod === "Transfer").reduce((sum, t) => sum + t.total, 0)
                    + filteredDebtPayments.filter(dp => dp.method === "QRIS" || dp.method === "Transfer").reduce((sum, dp) => sum + dp.amount, 0);

  const paymentMethodBreakdown = (["Tunai", "QRIS", "Transfer", "Hutang"] as PaymentMethod[]).map(method => {
    const amount = filtered.filter(t => t.paymentMethod === method).reduce((sum, t) => sum + t.total, 0);
    return {
      method,
      amount,
      percentage: omzet > 0 ? (amount / omzet) * 100 : 0
    };
  });

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
      kasMasuk: 0,
      laba: 0,
      transaksi: 0,
      bucketStart: bucket.bucketStart,
    };
    const cogs = transaction.items.reduce((sum, item) => sum + item.buyPrice * item.qty, 0);

    current.omzet += transaction.total;
    if (transaction.paymentMethod !== "Hutang") {
      current.kasMasuk += transaction.total;
    }
    current.laba += transaction.total - cogs;
    current.transaksi += 1;
    bucketMap.set(bucket.key, current);
  }

  for (const dp of filteredDebtPayments) {
    const date = new Date(dp.createdAt);
    const bucket = getBucketMeta(date, period, range.isCustom);
    const current = bucketMap.get(bucket.key) ?? {
      label: bucket.label,
      omzet: 0,
      kasMasuk: 0,
      laba: 0,
      transaksi: 0,
      bucketStart: bucket.bucketStart,
    };
    current.kasMasuk += dp.amount;
    bucketMap.set(bucket.key, current);
  }

  const revenueSeries = [...bucketMap.values()]
    .sort((a, b) => +new Date(a.bucketStart) - +new Date(b.bucketStart))
    .map((values) => ({
      label: values.label,
      omzet: values.omzet,
      kasMasuk: values.kasMasuk,
      laba: values.laba,
      transaksi: values.transaksi,
      bucketStart: values.bucketStart,
    }));

  const insights: string[] = [];
  if (revenueSeries.length > 0) {
    const highestDay = [...revenueSeries].sort((a, b) => b.omzet - a.omzet)[0];
    const lowestDay = [...revenueSeries].sort((a, b) => a.omzet - b.omzet)[0];
    if (highestDay && highestDay.omzet > 0) {
      insights.push(`Penjualan tertinggi terjadi pada ${highestDay.label} (${formatCurrency(highestDay.omzet)}).`);
    }
    if (lowestDay && lowestDay.omzet > 0 && lowestDay.label !== highestDay?.label) {
      insights.push(`Hari paling sepi adalah ${lowestDay.label}.`);
    }
  }

  if (topProducts.length > 0) {
    insights.push(`Produk paling diminati: ${topProducts[0].productName}.`);
  } else {
    insights.push("Belum ada data penjualan produk yang cukup.");
  }

  if (trend === "up") {
    insights.push(`Penjualan meningkat ${Math.round(omzetComparison.percentage)}% dibandingkan periode sebelumnya.`);
  } else if (trend === "down") {
    insights.push(`Penjualan menurun ${Math.round(omzetComparison.percentage)}% dibandingkan periode sebelumnya.`);
  }

  return {
    period,
    omzet,
    omzetComparison,
    pembayaranHutang,
    totalKasMasuk,
    kasTunai,
    uangDigital,
    piutangAktif,
    paymentMethodBreakdown,
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
    insights,
    filteredTransactions: filtered,
    filteredDebtPayments: filteredDebtPayments.map(dp => {
      const trx = data.transactions.find(t => t.id === dp.transactionId);
      const allTrxPayments = data.debtPayments
        .filter(p => p.transactionId === dp.transactionId)
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
      
      const paymentIndex = allTrxPayments.findIndex(p => p.id === dp.id);
      const paidSoFar = allTrxPayments.slice(0, paymentIndex + 1).reduce((s, p) => s + p.amount, 0);
      const remaining = (trx?.total ?? 0) - paidSoFar;

      return {
        ...dp,
        customerName: trx?.customerName ?? "Pelanggan",
        originalTransactionDate: trx?.createdAt ?? dp.createdAt,
        remainingDebtAfter: remaining,
      };
    }),
  };
}
