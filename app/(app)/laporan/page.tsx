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

const periodLabels: Record<ReportPeriod, string> = { harian: "harian", mingguan: "mingguan", bulanan: "bulanan" };

function toDateInputValue(value: string | null) { return value ? new Date(value).toISOString().slice(0, 10) : ""; }
function csvEscape(value: string | number) {
  const text = String(value ?? "");
  return text.includes(",") || text.includes("\n") || text.includes('"') ? `"${text.replace(/"/g, '""')}"` : text;
}
function downloadReportCsv(summary: ReportSummary, storeName: string, activeLabel: string) {
  const rows = [
    ["Nama Warung", storeName], ["Periode", activeLabel], ["Rentang", `${formatDate(summary.dateRange.from ?? "")} - ${formatDate(summary.dateRange.to ?? "")}`],
    ["Omzet", summary.omzet], ["Jumlah transaksi", summary.jumlahTransaksi], ["Rata-rata belanja", Math.round(summary.rataRataBelanja)], [],
    ["Produk", "Harga jual", "Qty terjual", "Omzet produk"],
    ...summary.soldProducts.map((p) => [p.productName, p.sellPrice, p.qty, p.omzet]),
  ];
  const blob = new Blob([rows.map((row) => row.map((cell) => csvEscape(cell ?? "")).join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `laporan-${storeName.toLowerCase().replace(/\s+/g, "-")}-${activeLabel.toLowerCase().replace(/\s+/g, "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function DetailPeriodCard({ title, summary }: { title: string; summary: ReportSummary }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden border-white/5">
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="text-white text-lg">Detail transaksi {title}</CardTitle>
        <CardDescription className="text-slate-400">{summary.jumlahTransaksi} transaksi tercatat.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4 xl:min-h-0 xl:flex-1 xl:overflow-y-auto pr-2">
        {summary.soldProducts.length ? (
          summary.soldProducts.map((product, index) => (
            <div key={`${title}-${product.productId}`} className="rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate text-sm">{product.productName}</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400 uppercase tracking-widest">Harga jual {formatCurrency(product.sellPrice)}</p>
                </div>
                <Badge variant={index === 0 ? "default" : "outline"} className="shrink-0">{product.qty} item</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm pt-3 border-t border-white/5">
                <span className="text-slate-400 text-xs">Total omzet</span>
                <span className="font-bold text-red-400">{formatCurrency(product.omzet)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 py-10 px-4 text-center">
            <p className="text-sm text-slate-400">Belum ada produk terjual pada periode {title}.</p>
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

  if (!data) return null;

  const invalidRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);
  const dailySummary = getReportSummary(data, "harian");
  const weeklySummary = getReportSummary(data, "mingguan");
  const monthlySummary = getReportSummary(data, "bulanan");
  const activeSummary = getReportSummary(data, period, invalidRange ? undefined : { dateFrom, dateTo });
  const activeRangeLabel = invalidRange ? "Rentang tanggal tidak valid" : activeSummary.dateRange.isCustom ? `${formatDate(activeSummary.dateRange.from ?? "")} - ${formatDate(activeSummary.dateRange.to ?? "")}` : activeSummary.dateRange.label;

  const summaryCards = [
    { label: "Omzet harian", value: formatCurrency(dailySummary.omzet), helper: `${dailySummary.jumlahTransaksi} transaksi` },
    { label: "Omzet mingguan", value: formatCurrency(weeklySummary.omzet), helper: `${weeklySummary.jumlahTransaksi} transaksi` },
    { label: "Omzet bulanan", value: formatCurrency(monthlySummary.omzet), helper: `${monthlySummary.jumlahTransaksi} transaksi` },
    { label: "Jumlah transaksi", value: formatNumber(activeSummary.jumlahTransaksi), helper: invalidRange ? "Periksa filter" : `Periode ${periodLabels[period]}` },
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-red-500/20 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none" />
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end relative z-10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-red-400 mb-1.5">Laporan Retail</p>
            <h2 className="text-3xl font-black text-white leading-tight">Omzet, transaksi, dan produk terlaris.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">Pilih periode utama, atur filter tanggal bila perlu, lalu export laporan aktif dalam sekali klik.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[{ value: "harian", label: "Grafik Harian" }, { value: "mingguan", label: "Grafik Mingguan" }, { value: "bulanan", label: "Grafik Bulanan" }].map((item) => (
                <Button key={item.value} variant={period === item.value ? "default" : "outline"} onClick={() => setPeriod(item.value as ReportPeriod)} className="h-10">
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Filter laporan</p>
                <p className="mt-2 text-lg font-bold text-white">Rentang aktif</p>
                <p className="mt-1 text-xs text-slate-400">{activeRangeLabel}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-2 text-slate-300">
                <CalendarRange className="size-4" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-white/5 border-white/10 text-white [color-scheme:dark]" />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-white/5 border-white/10 text-white [color-scheme:dark]" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => { setDateFrom(""); setDateTo(""); }} className="h-9 text-xs">Reset filter</Button>
              <Button onClick={() => downloadReportCsv(activeSummary, data.profile.name, `${periodLabels[period]}-${toDateInputValue(activeSummary.dateRange.from)}`)} disabled={invalidRange} className="h-9 text-xs">
                <Download className="size-3.5 mr-2" /> Export CSV
              </Button>
            </div>
            {invalidRange && <p className="mt-3 text-xs font-medium text-red-400">Tanggal selesai harus setelah tanggal mulai.</p>}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, index) => (
          <Card key={card.label} className="glass-card-hover group border-white/5 bg-white/5">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
                  <p className="mt-2 text-2xl font-black text-white">{card.value}</p>
                </div>
                <div className="rounded-xl bg-red-500/10 p-2.5 text-red-400 glow-red border border-red-500/20">
                  {index === 3 ? <TrendingUp className="size-4" /> : <Sparkles className="size-4" />}
                </div>
              </div>
              <p className="mt-4 text-xs font-medium text-slate-400">{card.helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr] xl:items-stretch">
        <Card className="flex flex-col overflow-hidden border-white/5 bg-white/5">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-white text-lg">Grafik omzet dan transaksi</CardTitle>
            <CardDescription className="text-slate-400">Visual penjualan untuk periode {periodLabels[period]}</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px] p-4 sm:p-6 flex-1 min-h-0">
            {activeSummary.revenueSeries.length && !invalidRange ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={activeSummary.revenueSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="omzetDarkGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#e53935" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#e53935" stopOpacity={0} />
                    </linearGradient>
                    <filter id="glowDarkLine"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={10} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <YAxis yAxisId="right" orientation="right" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dx={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(20,20,25,0.85)", backdropFilter: "blur(12px)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", color: "#fff" }}
                    formatter={(value, name) => [name === "omzet" ? formatCurrency(Number(value)) : formatNumber(Number(value)), name === "omzet" ? "Omzet" : "Transaksi"]}
                  />
                  <Legend formatter={(value) => <span className="text-slate-300 text-xs">{value === "omzet" ? "Omzet" : "Jumlah transaksi"}</span>} wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar yAxisId="right" dataKey="transaksi" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={16} fillOpacity={0.8} />
                  <Area yAxisId="left" type="natural" dataKey="omzet" stroke="#e53935" strokeWidth={3} fill="url(#omzetDarkGrad)" style={{ filter: "url(#glowDarkLine)" }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 text-sm text-slate-500">
                {invalidRange ? "Perbaiki rentang tanggal." : "Belum ada transaksi untuk periode ini."}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden border-white/5 bg-white/5">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-white text-lg">Produk Terlaris</CardTitle>
            <CardDescription className="text-slate-400">Item paling diminati pelanggan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto pr-2">
            {activeSummary.topProducts.length && !invalidRange ? (
              activeSummary.topProducts.map((product, index) => (
                <div key={product.productName} className="rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10 flex flex-col justify-between group">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{product.productName}</p>
                      <p className="mt-1 text-[11px] font-medium text-slate-400 uppercase tracking-widest">{product.qty} item terjual</p>
                    </div>
                    <Badge variant={index === 0 ? "default" : "secondary"} className={index === 0 ? "glow-red" : "bg-white/10 text-slate-300"}>#{index + 1}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-white/5">
                    <span className="text-slate-400 text-xs">Omzet produk</span>
                    <span className="font-bold text-red-400">{formatCurrency(product.omzet)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 text-center p-6 text-sm text-slate-500">
                {invalidRange ? "Perbaiki rentang tanggal." : "Belum ada produk terjual."}
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
