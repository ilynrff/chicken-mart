"use client";

import { useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarRange, Download, Sparkles, TrendingUp } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getReportSummary } from "@/lib/selectors";
import type { ReportPeriod, ReportSummary } from "@/lib/types";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

const periodLabels: Record<ReportPeriod, string> = {
  harian: "harian",
  mingguan: "mingguan",
  bulanan: "bulanan",
};

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function csvEscape(value: string | number) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function downloadReportCsv(summary: ReportSummary, storeName: string, activeLabel: string) {
  const rows = [
    ["Nama Warung", storeName],
    ["Periode", activeLabel],
    ["Rentang", `${formatDate(summary.dateRange.from ?? "")}` + ` - ${formatDate(summary.dateRange.to ?? "")}`],
    ["Omzet", summary.omzet],
    ["Jumlah transaksi", summary.jumlahTransaksi],
    ["Rata-rata belanja", Math.round(summary.rataRataBelanja)],
    [],
    ["Produk", "Harga jual", "Qty terjual", "Omzet produk"],
    ...summary.soldProducts.map((product) => [
      product.productName,
      product.sellPrice,
      product.qty,
      product.omzet,
    ]),
  ];

  const csv = rows.map((row) => row.map((cell) => csvEscape(cell ?? "")).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `laporan-${storeName.toLowerCase().replace(/\s+/g, "-")}-${activeLabel.toLowerCase().replace(/\s+/g, "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function DetailPeriodCard({
  title,
  summary,
}: {
  title: string;
  summary: ReportSummary;
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden border-white/70 bg-white/85 shadow-[0_22px_60px_-42px_rgba(220,38,38,0.55)] backdrop-blur">
      <CardHeader className="border-b border-red-100/70 pb-4">
        <CardTitle>Detail transaksi {title}</CardTitle>
        <CardDescription>
          {summary.jumlahTransaksi} transaksi dengan rincian produk, harga jual, dan jumlah terjual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-3">
        {summary.soldProducts.length ? (
          summary.soldProducts.map((product, index) => (
            <div
              key={`${title}-${product.productId}`}
              className="rounded-[24px] border border-red-100 bg-gradient-to-br from-white to-red-50/70 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{product.productName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Harga jual {formatCurrency(product.sellPrice)}</p>
                </div>
                <Badge variant={index === 0 ? "default" : "outline"}>{product.qty} item</Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total omzet produk</span>
                <span className="font-semibold text-primary">{formatCurrency(product.omzet)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[20px] border border-dashed border-red-200 bg-red-50/60 p-4 text-sm text-muted-foreground">
            Belum ada produk terjual pada periode {title}.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LaporanPage() {
  const { data } = useData();
  const [period, setPeriod] = useState<ReportPeriod>("mingguan");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  if (!data) {
    return null;
  }

  const invalidRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);
  const dailySummary = getReportSummary(data, "harian");
  const weeklySummary = getReportSummary(data, "mingguan");
  const monthlySummary = getReportSummary(data, "bulanan");
  const activeSummary = getReportSummary(data, period, invalidRange ? undefined : { dateFrom, dateTo });
  const activeRangeLabel = invalidRange
    ? "Rentang tanggal tidak valid"
    : activeSummary.dateRange.isCustom
      ? `${formatDate(activeSummary.dateRange.from ?? "")} - ${formatDate(activeSummary.dateRange.to ?? "")}`
      : activeSummary.dateRange.label;

  const summaryCards = [
    {
      label: "Omzet harian",
      value: formatCurrency(dailySummary.omzet),
      helper: `${dailySummary.jumlahTransaksi} transaksi`,
    },
    {
      label: "Omzet mingguan",
      value: formatCurrency(weeklySummary.omzet),
      helper: `${weeklySummary.jumlahTransaksi} transaksi`,
    },
    {
      label: "Omzet bulanan",
      value: formatCurrency(monthlySummary.omzet),
      helper: `${monthlySummary.jumlahTransaksi} transaksi`,
    },
    {
      label: "Jumlah transaksi",
      value: formatNumber(activeSummary.jumlahTransaksi),
      helper: invalidRange ? "Periksa filter tanggal" : `Periode ${periodLabels[period]}`,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-white/70 bg-gradient-to-br from-white via-red-50/80 to-red-100/70 shadow-[0_26px_80px_-50px_rgba(220,38,38,0.6)]">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <Badge className="border-red-200 bg-white/80 text-primary" variant="outline">
              Laporan retail Chicken Mart
            </Badge>
            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950">
              Omzet, transaksi, produk terlaris, dan detail penjualan kini lebih rapi dibaca.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Pilih periode utama, atur filter tanggal bila perlu, lalu export laporan aktif dalam sekali klik.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { value: "harian", label: "Grafik Harian" },
                { value: "mingguan", label: "Grafik Mingguan" },
                { value: "bulanan", label: "Grafik Bulanan" },
              ].map((item) => (
                <Button
                  key={item.value}
                  variant={period === item.value ? "default" : "outline"}
                  onClick={() => setPeriod(item.value as ReportPeriod)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Filter laporan</p>
                <p className="mt-2 text-lg font-bold text-slate-950">Rentang aktif</p>
                <p className="mt-1 text-sm text-muted-foreground">{activeRangeLabel}</p>
              </div>
              <div className="rounded-2xl bg-red-50 p-3 text-primary">
                <CalendarRange className="size-5" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
              <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Reset filter
              </Button>
              <Button
                onClick={() => downloadReportCsv(activeSummary, data.profile.name, `${periodLabels[period]}-${toDateInputValue(activeSummary.dateRange.from)}`)}
                disabled={invalidRange}
              >
                <Download className="size-4" />
                Export laporan
              </Button>
            </div>

            {invalidRange ? (
              <p className="mt-3 text-sm text-destructive">Tanggal selesai tidak boleh lebih kecil dari tanggal mulai.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, index) => (
          <Card
            key={card.label}
            className="border-white/70 bg-white/90 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.45)] backdrop-blur"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-2 text-3xl font-black text-primary">{card.value}</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-red-500/15 to-red-100 p-3 text-primary">
                  {index === 3 ? <TrendingUp className="size-5" /> : <Sparkles className="size-5" />}
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{card.helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] xl:items-stretch">
        <Card className="border-white/70 bg-white/90 shadow-[0_24px_70px_-50px_rgba(220,38,38,0.6)]">
          <CardHeader className="border-b border-red-100/70 pb-4">
            <CardTitle>Grafik omzet dan jumlah transaksi</CardTitle>
            <CardDescription>
              Visual penjualan untuk periode {periodLabels[period]}{invalidRange ? "" : ` dengan ${activeRangeLabel.toLowerCase()}` }.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[360px] p-4 sm:p-6">
            {activeSummary.revenueSeries.length && !invalidRange ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={activeSummary.revenueSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="omzetGradientEnhanced" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1d2d2" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#7f1d1d", fontSize: 12 }} />
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#7f1d1d", fontSize: 12 }}
                    tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#7f1d1d", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(254, 226, 226, 0.45)" }}
                    contentStyle={{
                      borderRadius: 18,
                      border: "1px solid #fecaca",
                      boxShadow: "0 18px 45px -28px rgba(220,38,38,0.45)",
                    }}
                    formatter={(value, name) => {
                      const normalizedValue = typeof value === "number" ? value : Number(value ?? 0);
                      const normalizedName = String(name);

                      if (normalizedName === "omzet") {
                        return [formatCurrency(normalizedValue), "Omzet"] as [string, string];
                      }

                      return [formatNumber(normalizedValue), "Transaksi"] as [string, string];
                    }}
                  />
                  <Legend formatter={(value) => (value === "omzet" ? "Omzet" : "Jumlah transaksi")} />
                  <Bar yAxisId="right" dataKey="transaksi" fill="#fb923c" radius={[10, 10, 0, 0]} barSize={24} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="omzet"
                    stroke="#dc2626"
                    strokeWidth={3}
                    fill="url(#omzetGradientEnhanced)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-red-200 bg-red-50/60 text-sm text-muted-foreground">
                {invalidRange ? "Perbaiki rentang tanggal untuk melihat chart." : "Belum ada transaksi untuk periode ini."}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/90 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.45)]">
          <CardHeader className="border-b border-red-100/70 pb-4">
            <CardTitle>Produk terlaris</CardTitle>
            <CardDescription>Produk yang paling sering diminati pelanggan pada periode aktif.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-6">
            {activeSummary.topProducts.length && !invalidRange ? (
              activeSummary.topProducts.map((product, index) => (
                <div
                  key={product.productName}
                  className="rounded-[24px] border border-red-100 bg-gradient-to-br from-white to-red-50/70 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{product.productName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{product.qty} item terjual</p>
                    </div>
                    <Badge variant={index === 0 ? "default" : "outline"}>#{index + 1}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Omzet produk</span>
                    <span className="font-semibold text-primary">{formatCurrency(product.omzet)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-red-200 bg-red-50/60 p-4 text-sm text-muted-foreground">
                {invalidRange ? "Perbaiki rentang tanggal untuk melihat produk terlaris." : "Belum ada produk terjual pada periode ini."}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3 xl:items-stretch">
        <DetailPeriodCard title="harian" summary={dailySummary} />
        <DetailPeriodCard title="mingguan" summary={weeklySummary} />
        <DetailPeriodCard title="bulanan" summary={monthlySummary} />
      </section>
    </div>
  );
}
