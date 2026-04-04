"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  ClipboardList,
  PackageSearch,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useData } from "@/components/providers/data-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardMetrics, getReportSummary } from "@/lib/selectors";
import { cn, formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";

const insightToneStyles = {
  positive: "border-emerald-200 bg-emerald-50/85 text-emerald-900",
  warning: "border-amber-200 bg-amber-50/90 text-amber-900",
  neutral: "border-slate-200 bg-slate-50/90 text-slate-900",
} as const;

export default function DashboardPage() {
  const { data } = useData();

  if (!data) {
    return null;
  }

  const metrics = getDashboardMetrics(data);
  const weeklyReport = getReportSummary(data, "mingguan");
  const cards = [
    {
      title: "Omzet hari ini",
      value: formatCurrency(metrics.omzetHariIni),
      description: `${metrics.transaksiHariIni} transaksi tercatat`,
      icon: Banknote,
      accent: "from-red-500/15 via-red-50 to-white",
    },
    {
      title: "Stok menipis",
      value: formatNumber(metrics.stokMenipis),
      description: `${metrics.stokHabis} produk sudah habis`,
      icon: PackageSearch,
      accent: "from-amber-400/20 via-orange-50 to-white",
    },
    {
      title: "Kasbon aktif",
      value: formatCurrency(metrics.totalKasbon),
      description: `${metrics.pelangganKasbonAktif} pelanggan`,
      icon: ClipboardList,
      accent: "from-rose-500/15 via-rose-50 to-white",
    },
    {
      title: "Omzet minggu berjalan",
      value: formatCurrency(metrics.omzetMingguBerjalan),
      description: metrics.produkTerlarisMinggu
        ? `${metrics.produkTerlarisMinggu.productName} paling diminati`
        : "Menunggu transaksi minggu ini",
      icon: ShoppingBag,
      accent: "from-red-500/10 via-orange-50 to-white",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-white/70 bg-gradient-to-br from-white via-red-50/85 to-red-100/80 shadow-[0_26px_80px_-48px_rgba(220,38,38,0.55)]">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <Badge className="mb-4 w-fit border-red-200 bg-white/80 text-primary" variant="outline">
                Dashboard insight
              </Badge>
              <h2 className="text-3xl font-black leading-tight text-slate-950">
                Angka penting warung kini terasa lebih hidup, lebih cepat dibaca, dan lebih mudah ditindaklanjuti.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Pantau omzet hari ini, ritme transaksi, produk paling diminati, dan area yang perlu perhatian tanpa harus
                pindah halaman lebih dulu.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-sm shadow-sm">
                  <p className="text-muted-foreground">Workspace</p>
                  <p className="font-semibold text-slate-950">{data.workspace.name}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-sm shadow-sm">
                  <p className="text-muted-foreground">Metode aktif</p>
                  <p className="font-semibold text-slate-950">{data.settings.enabledPaymentMethods.join(", ")}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-sm shadow-sm">
                  <p className="text-muted-foreground">Minimum stok</p>
                  <p className="font-semibold text-slate-950">{data.settings.defaultMinimumStock} item</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 rounded-[30px] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
              <div className="rounded-[24px] bg-gradient-to-br from-primary to-red-500 p-5 text-primary-foreground shadow-[0_18px_50px_-28px_rgba(220,38,38,0.7)]">
                <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/80">Fokus hari ini</p>
                <p className="mt-3 text-4xl font-black">{formatCurrency(metrics.omzetHariIni)}</p>
                <p className="mt-2 text-sm text-primary-foreground/85">{metrics.transaksiHariIni} transaksi sudah masuk hari ini.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[24px] border border-red-100 bg-red-50/70 p-4">
                  <p className="text-sm text-muted-foreground">Rata-rata belanja hari ini</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">{formatCurrency(metrics.avgBelanjaHariIni)}</p>
                </div>
                <div className="rounded-[24px] border border-red-100 bg-white p-4">
                  <p className="text-sm text-muted-foreground">Produk terlaris minggu ini</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {metrics.produkTerlarisMinggu?.productName ?? "Belum ada data"}
                  </p>
                  <p className="mt-1 text-sm text-primary">
                    {metrics.produkTerlarisMinggu
                      ? `${formatNumber(metrics.produkTerlarisMinggu.qty)} item terjual`
                      : "Transaksi minggu ini belum cukup untuk dibaca."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-white/70 bg-slate-950 text-white shadow-[0_30px_80px_-45px_rgba(15,23,42,0.8)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/70">Ritme penjualan</p>
                <p className="mt-2 text-3xl font-black">7 hari terakhir</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-white">
                <TrendingUp className="size-5" />
              </div>
            </div>
            <div className="mt-5 h-[220px] rounded-[28px] border border-white/10 bg-white/5 p-3">
              {weeklyReport.revenueSeries.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyReport.revenueSeries} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashboardWeeklyOmzet" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#fb7185" stopOpacity={0.55} />
                        <stop offset="95%" stopColor="#fb7185" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#fca5a5", fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "#fecaca", fontSize: 12 }} tickFormatter={(value: number) => `${Math.round(value / 1000)}k`} />
                    <Tooltip
                      cursor={{ stroke: "rgba(255,255,255,0.12)", strokeWidth: 1 }}
                      contentStyle={{
                        backgroundColor: "#111827",
                        borderRadius: 18,
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#fff",
                      }}
                      formatter={(value) => [formatCurrency(typeof value === "number" ? value : Number(value ?? 0)), "Omzet"]}
                    />
                    <Area type="monotone" dataKey="omzet" stroke="#fb7185" strokeWidth={3} fill="url(#dashboardWeeklyOmzet)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-white/15 text-sm text-white/70">
                  Belum ada transaksi untuk diringkas minggu ini.
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-[24px] bg-white/5 px-4 py-3 text-sm text-white/80">
              <span>Rata-rata transaksi mingguan</span>
              <span className="font-semibold text-white">{formatCurrency(weeklyReport.rataRataBelanja)}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.title}
              className="overflow-hidden border-white/70 bg-white/90 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.4)]"
            >
              <CardContent className="p-5">
                <div className={cn("rounded-[24px] border border-white/70 bg-gradient-to-br p-4", item.accent)}>
                  <Icon className="size-6 text-primary" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{item.title}</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{item.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-white/70 bg-white/90 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.45)]">
          <CardHeader className="border-b border-red-100/70 pb-4">
            <CardTitle>Insight operasional</CardTitle>
            <CardDescription>Highlight yang bisa langsung dipakai untuk ambil tindakan hari ini.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
            {metrics.insights.map((insight) => (
              <div
                key={insight.title}
                className={cn(
                  "rounded-[24px] border p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5",
                  insightToneStyles[insight.tone],
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{insight.title}</p>
                    <p className="mt-2 text-xl font-black">{insight.value}</p>
                  </div>
                  <Sparkles className="mt-1 size-5 opacity-70" />
                </div>
                <p className="mt-3 text-sm leading-6 opacity-90">{insight.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/90 shadow-[0_22px_60px_-42px_rgba(220,38,38,0.45)]">
          <CardHeader className="border-b border-red-100/70 pb-4">
            <CardTitle>Produk perlu perhatian</CardTitle>
            <CardDescription>Stok sudah menyentuh batas minimum atau di bawahnya.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {metrics.attentionProducts.length ? (
              metrics.attentionProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-[24px] border border-red-100 bg-gradient-to-r from-white to-red-50/70 p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-950">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                  </div>
                  <Badge variant={product.stock === 0 ? "danger" : "warning"}>
                    {product.stock} / min {product.minimumStock}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-red-200 bg-red-50/60 p-4 text-sm text-muted-foreground">
                Semua produk masih aman.
              </div>
            )}

            <div className="flex items-start gap-3 rounded-[24px] border border-amber-200 bg-amber-50/85 p-4 text-amber-900">
              <AlertTriangle className="mt-1 size-5" />
              <div>
                <p className="font-semibold">Catatan operasional</p>
                <p className="mt-1 text-sm leading-6">
                  Restock produk tipis lebih dulu, terutama item yang sudah habis, supaya kasir tetap lancar saat jam ramai.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/70 bg-white/90 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.45)]">
          <CardHeader className="border-b border-red-100/70 pb-4">
            <CardTitle>Transaksi terbaru</CardTitle>
            <CardDescription>Aktivitas penjualan paling baru di workspace ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {metrics.recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex flex-col gap-3 rounded-[24px] border border-border/80 bg-gradient-to-r from-white to-red-50/40 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-950">{transaction.items.map((item) => item.productName).join(", ")}</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(transaction.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{transaction.paymentMethod}</Badge>
                  <p className="font-semibold text-slate-950">{formatCurrency(transaction.total)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-white shadow-[0_26px_70px_-42px_rgba(15,23,42,0.85)]">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-white/70">Quick focus</p>
            <p className="mt-3 text-3xl font-black">{metrics.produkTerlarisMinggu?.productName ?? "Belum ada unggulan"}</p>
            <p className="mt-2 text-sm leading-6 text-white/75">
              {metrics.produkTerlarisMinggu
                ? `Produk ini terjual ${formatNumber(metrics.produkTerlarisMinggu.qty)} item dengan omzet ${formatCurrency(metrics.produkTerlarisMinggu.omzet)}.`
                : "Begitu transaksi berjalan, dashboard akan memberi sinyal produk yang paling diminati pelanggan."}
            </p>
            <div className="mt-6 grid gap-3">
              <div className="rounded-[24px] bg-white/8 p-4">
                <p className="text-sm text-white/70">Pelanggan kasbon aktif</p>
                <p className="mt-1 text-2xl font-bold text-white">{formatNumber(metrics.pelangganKasbonAktif)}</p>
              </div>
              <div className="flex items-center justify-between rounded-[24px] bg-white/8 p-4">
                <div>
                  <p className="text-sm text-white/70">Buka laporan lengkap</p>
                  <p className="mt-1 font-semibold text-white">Lihat tren omzet dan detail produk terjual</p>
                </div>
                <ArrowUpRight className="size-5 text-rose-200" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

