"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  Box,
  ChevronRight,
  Clock,
  CreditCard,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Wallet,
  Activity
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useData } from "@/components/providers/data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardMetrics, getReportSummary } from "@/lib/selectors";
import { cn, formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";

export default function DashboardPage() {
  const { data } = useData();

  if (!data) {
    return null;
  }

  const metrics = getDashboardMetrics(data);
  const weeklyReport = getReportSummary(data, "mingguan");

  const kpiCards = [
    {
      title: "Transaksi Hari Ini",
      value: `${metrics.transaksiHariIni} transaksi`,
      icon: Receipt,
      glowColor: "group-hover:text-blue-400 group-hover:shadow-[0_0_15px_rgba(96,165,250,0.5)]",
      iconBg: "bg-blue-500/10 text-blue-400",
    },
    {
      title: "Stok Bermasalah",
      value: `${metrics.stokMenipis} item`,
      icon: Package,
      glowColor: "group-hover:text-red-400 group-hover:shadow-[0_0_15px_rgba(248,113,113,0.5)]",
      iconBg: "bg-red-500/10 text-red-400",
    },
    {
      title: "Kasbon Aktif",
      value: formatCurrency(metrics.totalKasbon),
      icon: Wallet,
      glowColor: "group-hover:text-amber-400 group-hover:shadow-[0_0_15px_rgba(251,191,36,0.5)]",
      iconBg: "bg-amber-500/10 text-amber-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Grid: Main Chart & Insight */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        
        {/* 3. MAIN DASHBOARD CARD */}
        <div className="glass-card flex flex-col overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
            <Activity className="size-32 text-red-500 blur-3xl" />
          </div>
          
          <div className="p-6 relative z-10 border-b border-white/5">
            <div className="flex justify-between items-start">
              <div className="flex gap-8">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Penjualan Hari Ini</p>
                  <h3 className="text-4xl font-black text-white tracking-tight">{formatCurrency(metrics.omzetHariIni)}</h3>
                </div>
                <div className="border-l border-white/10 pl-8">
                  <p className="text-xs font-medium text-emerald-500 uppercase tracking-wider mb-2">Kas Masuk Hari Ini</p>
                  <h3 className="text-2xl font-black text-emerald-400 tracking-tight">{formatCurrency(metrics.kasMasukHariIni)}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                <TrendingUp className="size-4 text-red-400" />
                <span className="text-xs font-medium text-red-400">Trend Aktif</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 flex-1 min-h-[300px]">
            {weeklyReport.revenueSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyReport.revenueSeries} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOmzetRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e53935" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#e53935" stopOpacity={0} />
                    </linearGradient>
                    <filter id="glowLine">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "rgba(20, 20, 25, 0.8)", 
                      backdropFilter: "blur(12px)",
                      borderRadius: "12px", 
                      border: "1px solid rgba(255,255,255,0.1)", 
                      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                      color: "#fff"
                    }}
                    formatter={(value, name) => [name === "omzet" ? formatCurrency(Number(value)) : formatNumber(Number(value)), name === "omzet" ? "Omzet" : "Transaksi"]}
                  />
                  <Area 
                    type="natural" 
                    dataKey="omzet" 
                    stroke="#e53935" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorOmzetRed)" 
                    style={{ filter: "url(#glowLine)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center border border-dashed border-white/10 rounded-xl">
                <p className="text-sm font-medium text-slate-500">Belum ada data penjualan minggu ini.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* 6. INSIGHT PANEL */}
          <div className="glass-card glow-red-border border relative overflow-hidden flex-shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 blur-3xl pointer-events-none rounded-full" />
            <div className="p-5">
              <h4 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-4 uppercase tracking-wider">
                <AlertTriangle className="size-4" /> Insight Penting
              </h4>
              <div className="space-y-3">
                {metrics.insights.map((insight, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-4 backdrop-blur-md">
                    <p className="text-sm font-semibold text-white">{insight.title}</p>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{insight.description}</p>
                  </div>
                ))}
                {metrics.insights.length === 0 && (
                  <div className="bg-white/5 border border-white/5 rounded-xl p-4 backdrop-blur-md">
                    <p className="text-sm font-semibold text-white">Semua Terkendali</p>
                    <p className="mt-1 text-xs text-slate-400">Belum ada insight darurat hari ini.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. KPI MINI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4">
            {kpiCards.map((kpi, i) => (
              <div key={i} className="glass-card glass-card-hover p-4 group cursor-pointer flex items-center gap-4">
                <div className={cn("flex size-12 items-center justify-center rounded-xl transition-all duration-300", kpi.iconBg, kpi.glowColor)}>
                  <kpi.icon className="size-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{kpi.title}</p>
                  <p className="text-lg font-bold text-white mt-0.5">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Transactions & Stock */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        
        {/* 7. RECENT TRANSACTIONS */}
        <div className="glass-card flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <h4 className="text-lg font-bold text-white">Transaksi Terbaru</h4>
              <p className="text-sm text-slate-400 mt-1">Aktivitas kasir hari ini</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/5">
              <Link href="/laporan">
                Lihat Semua <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
          <div className="p-2">
            {metrics.recentTransactions.length > 0 ? (
              <div className="space-y-1">
                {metrics.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="glass-card-hover flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-300">
                        <ShoppingCart className="size-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{transaction.items.map(i => i.productName).join(", ")}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="size-3 text-slate-500" />
                          <span className="text-xs text-slate-400">
                            {formatDateTime(transaction.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
                        {transaction.paymentMethod === "Tunai" ? <Banknote className="mr-1.5 size-3.5 text-emerald-400" /> : <CreditCard className="mr-1.5 size-3.5 text-blue-400" />}
                        <span className="text-xs font-medium text-slate-300 capitalize">{transaction.paymentMethod}</span>
                      </div>
                      <p className="font-bold text-white w-24 text-right text-base">{formatCurrency(transaction.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-white/5 p-4 mb-3 border border-white/10">
                  <Receipt className="size-6 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-white">Belum ada transaksi</p>
                <p className="text-xs text-slate-400 mt-1">Mulai transaksi pertama di Kasir.</p>
              </div>
            )}
          </div>
        </div>

        {/* 5. RIGHT PANEL: Stock Alerts */}
        <div className="glass-card flex flex-col">
          <div className="p-6 border-b border-white/5">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <Box className="size-5 text-amber-500" />
              Peringatan Stok
            </h4>
            <p className="text-sm text-slate-400 mt-1">Produk perlu segera di-restock</p>
          </div>
          <div className="p-4 flex-1">
            <div className="space-y-3">
              {metrics.attentionProducts.length > 0 ? (
                metrics.attentionProducts.map((product) => (
                  <div key={product.id} className="glass-card-hover flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 transition-colors">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="truncate font-semibold text-white text-sm">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider", 
                          product.stock === 0 ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        )}>
                          {product.stock === 0 ? "Habis" : "Menipis"}
                        </span>
                        <span className="text-xs text-slate-400">
                          Sisa {product.stock}
                        </span>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline" className="shrink-0 h-8 rounded-lg bg-transparent border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white glow-red transition-all">
                      <Link href="/inventaris">Restock</Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                  <div className="rounded-full bg-emerald-500/10 p-3 mb-3 border border-emerald-500/20">
                    <Box className="size-5 text-emerald-400" />
                  </div>
                  <p className="text-sm font-medium text-white">Stok Aman Terkendali</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Semua produk berada di atas batas minimum.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
