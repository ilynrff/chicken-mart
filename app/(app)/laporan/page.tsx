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
    ["Penjualan (Omzet)", summary.omzet], ["Pembayaran Hutang", summary.pembayaranHutang], ["Total Kas Masuk", summary.totalKasMasuk], 
    ["Jumlah transaksi", summary.jumlahTransaksi], ["Rata-rata belanja", Math.round(summary.rataRataBelanja)], [],
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

function RiwayatPenjualan({ summary }: { summary: ReportSummary }) {
  return (
    <Card className="flex flex-col overflow-hidden border-white/5">
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="text-white text-lg">Riwayat Penjualan</CardTitle>
        <CardDescription className="text-slate-400">Daftar lengkap transaksi pada periode ini.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {summary.filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-sm whitespace-nowrap relative">
              <thead className="bg-black/90 text-slate-400 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-widest text-[11px]">Tanggal</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-widest text-[11px]">Item</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-widest text-[11px]">Qty</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-widest text-[11px]">Metode</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-widest text-[11px] text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white">
                {[...summary.filteredTransactions].sort((a,b) => +new Date(b.createdAt) - +new Date(a.createdAt)).map((trx) => (
                  <tr key={trx.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-slate-300">{formatDate(trx.createdAt)}</td>
                    <td className="px-6 py-4 font-semibold max-w-[200px] truncate">{trx.items.map(i => i.productName).join(", ")}</td>
                    <td className="px-6 py-4 text-slate-300">{trx.items.reduce((sum, item) => sum + item.qty, 0)}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={trx.paymentMethod === "Hutang" ? "border-amber-500/30 text-amber-400 bg-amber-500/10" : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"}>
                        {trx.paymentMethod}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-bold text-white text-right">{formatCurrency(trx.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="rounded-full bg-white/5 p-4 mb-3 border border-white/10">
              <TrendingUp className="size-6 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-white">Belum ada transaksi</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RiwayatPembayaran({ summary }: { summary: ReportSummary }) {
  return (
    <Card className="flex flex-col overflow-hidden border-white/5">
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="text-white text-lg">Riwayat Pembayaran Hutang</CardTitle>
        <CardDescription className="text-slate-400">Daftar cicilan hutang yang masuk pada periode ini.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {summary.filteredDebtPayments.length > 0 ? (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-sm whitespace-nowrap relative">
              <thead className="bg-black/90 text-slate-400 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-widest text-[11px]">Tanggal Bayar</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-widest text-[11px]">Pelanggan</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-widest text-[11px]">Metode</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-widest text-[11px]">Transaksi Asal</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-widest text-[11px] text-right">Nominal Masuk</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-widest text-[11px] text-right">Sisa Hutang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white">
                {[...summary.filteredDebtPayments].sort((a,b) => +new Date(b.createdAt) - +new Date(a.createdAt)).map((dp) => (
                  <tr key={dp.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-slate-300">{formatDate(dp.createdAt)}</td>
                    <td className="px-6 py-4 font-semibold text-white">{dp.customerName}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-300">{dp.method}</Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{formatDate(dp.originalTransactionDate)}</td>
                    <td className="px-6 py-4 font-bold text-emerald-400 text-right">{formatCurrency(dp.amount)}</td>
                    <td className="px-6 py-4 text-slate-400 text-right text-xs">{formatCurrency(dp.remainingDebtAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="rounded-full bg-white/5 p-4 mb-3 border border-white/10">
              <TrendingUp className="size-6 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-white">Belum ada pembayaran hutang</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LaporanPage() {
  const { data } = useData();
  const [period, setPeriod] = useState<ReportPeriod>("harian");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  if (!data) return null;

  const invalidRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);
  const activeSummary = getReportSummary(data, period, invalidRange ? undefined : { dateFrom, dateTo });
  const activeRangeLabel = invalidRange ? "Rentang tanggal tidak valid" : activeSummary.dateRange.isCustom ? `${formatDate(activeSummary.dateRange.from ?? "")} - ${formatDate(activeSummary.dateRange.to ?? "")}` : activeSummary.dateRange.label;

  const summaryCards = [
    { 
      label: "Total Penjualan", 
      value: formatCurrency(activeSummary.omzet), 
      helper: "Seluruh barang terjual (termasuk hutang)"
    },
    { label: "Total Kas Masuk", value: formatCurrency(activeSummary.totalKasMasuk), helper: "Uang nyata (tunai & digital) yang diterima" },
    { label: "Piutang Aktif", value: formatCurrency(activeSummary.piutangAktif), helper: "Total hutang yang belum dilunasi" },
    { label: "Pembayaran Hutang", value: formatCurrency(activeSummary.pembayaranHutang), helper: "Uang cicilan yang diterima" },
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
              {[{ value: "harian", label: "Harian" }, { value: "mingguan", label: "Mingguan" }, { value: "bulanan", label: "Bulanan" }].map((item) => (
                <Button key={item.value} variant={period === item.value ? "default" : "outline"} onClick={() => setPeriod(item.value as ReportPeriod)} className="h-10 px-6 rounded-xl font-semibold">
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
                <div className={index === 1 ? "rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20" : index === 2 ? "rounded-xl bg-amber-500/10 p-2.5 text-amber-400 border border-amber-500/20" : "rounded-xl bg-red-500/10 p-2.5 text-red-400 glow-red border border-red-500/20"}>
                  <TrendingUp className="size-4" />
                </div>
              </div>
              <div className="mt-4 text-xs font-medium text-slate-400">{card.helper}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Cashflow & Payment Breakdown */}
      <section className="grid gap-6 xl:grid-cols-2 xl:items-stretch">
        <Card className="flex flex-col overflow-hidden border-white/5 bg-white/5">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-white text-lg">Klasifikasi Kas Masuk</CardTitle>
            <CardDescription className="text-slate-400">Pemisahan uang tunai fisik dan saldo digital</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-center gap-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
              <div>
                <p className="text-sm font-semibold text-white">Kas Tunai</p>
                <p className="text-xs text-slate-400 mt-1">Uang fisik di laci kasir</p>
              </div>
              <p className="text-xl font-black text-emerald-400">{formatCurrency(activeSummary.kasTunai)}</p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
              <div>
                <p className="text-sm font-semibold text-white">Uang Digital</p>
                <p className="text-xs text-slate-400 mt-1">Saldo di rekening & e-wallet (QRIS/Transfer)</p>
              </div>
              <p className="text-xl font-black text-blue-400">{formatCurrency(activeSummary.uangDigital)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden border-white/5 bg-white/5">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-white text-lg">Metode Pembayaran (Penjualan)</CardTitle>
            <CardDescription className="text-slate-400">Kontribusi metode bayar terhadap total omzet</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col gap-4">
            {activeSummary.paymentMethodBreakdown.map(method => (
              <div key={method.method} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">{method.method}</span>
                  <span className="text-slate-300 font-bold">{formatCurrency(method.amount)} <span className="text-slate-500 font-normal ml-1">({Math.round(method.percentage)}%)</span></span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full rounded-full ${method.method === "Hutang" ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.max(method.percentage, 1)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Insight Panel */}
      {activeSummary.insights.length > 0 && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-500/20 p-2 text-blue-400">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Insight {periodLabels[period]}</h3>
              <ul className="space-y-1 text-sm text-slate-300">
                {activeSummary.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr] xl:items-stretch">
        <Card className="flex flex-col overflow-hidden border-white/5 bg-white/5">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-white text-lg">Grafik Penjualan & Arus Kas</CardTitle>
            <CardDescription className="text-slate-400">Perbandingan omzet (penjualan) vs kas masuk nyata</CardDescription>
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
                    <linearGradient id="kasDarkGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <filter id="glowDarkLine"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={10} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <YAxis yAxisId="right" orientation="right" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dx={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(20,20,25,0.85)", backdropFilter: "blur(12px)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", color: "#fff" }}
                    formatter={(value, name) => [
                      name === "omzet" ? formatCurrency(Number(value)) : name === "kasMasuk" ? formatCurrency(Number(value)) : formatNumber(Number(value)), 
                      name === "omzet" ? "Total Penjualan" : name === "kasMasuk" ? "Kas Masuk" : "Transaksi"
                    ]}
                  />
                  <Legend formatter={(value) => <span className="text-slate-300 text-[10px]">{value === "omzet" ? "Penjualan" : value === "kasMasuk" ? "Kas Masuk" : "Transaksi"}</span>} wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar yAxisId="right" dataKey="transaksi" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={12} fillOpacity={0.6} />
                  <Area yAxisId="left" type="natural" dataKey="kasMasuk" stroke="#10b981" strokeWidth={2} fill="url(#kasDarkGrad)" strokeDasharray="5 5" />
                  <Area yAxisId="left" type="natural" dataKey="omzet" stroke="#e53935" strokeWidth={3} fill="url(#omzetDarkGrad)" style={{ filter: "url(#glowDarkLine)" }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 text-sm text-slate-500">
                {invalidRange ? "Perbaiki rentang tanggal." : "Belum ada transaksi di periode ini."}
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
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white text-sm truncate pr-2">{product.productName}</p>
                      <p className="mt-1 text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                        {product.qty} item terjual 
                        <span className="mx-2 text-white/20">•</span> 
                        {Math.round((product.omzet / activeSummary.omzet) * 100)}% dari total
                      </p>
                    </div>
                    <Badge variant={index === 0 ? "default" : "outline"} className={index === 0 ? "glow-red" : "bg-white/10 text-slate-300 border-white/10"}>#{index + 1}</Badge>
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

      <section className="grid gap-6">
        <RiwayatPenjualan summary={activeSummary} />
        <RiwayatPembayaran summary={activeSummary} />
      </section>
    </div>
  );
}
