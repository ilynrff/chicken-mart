"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, FileText, HandCoins, User } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaymentMethod, Transaction } from "@/lib/types";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

type DebtSummary = Transaction & {
  remainingDebt: number;
  paidAmount: number;
};

export default function HutangPage() {
  const { data, createDebtPayment, isMutating } = useData();
  const [filter, setFilter] = useState<"semua" | "belum lunas" | "lunas">("belum lunas");
  
  // Payment Modal State
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtSummary | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Tunai");
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [detailOpen, setDetailOpen] = useState(false);

  const debts = useMemo(() => {
    if (!data) return [];
    
    return data.transactions
      .filter((t) => t.paymentMethod === "Hutang")
      .map((t) => {
        const payments = data.debtPayments.filter((dp) => dp.transactionId === t.id);
        const paidAmount = payments.reduce((sum, dp) => sum + dp.amount, 0);
        const remainingDebt = t.total - paidAmount;
        return { ...t, remainingDebt, paidAmount };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data]);

  const filteredDebts = useMemo(() => {
    if (filter === "semua") return debts;
    if (filter === "lunas") return debts.filter(d => d.remainingDebt <= 0);
    return debts.filter(d => d.remainingDebt > 0);
  }, [debts, filter]);

  if (!data) return null;

  const activeTotal = debts
    .filter(d => d.remainingDebt > 0)
    .reduce((sum, d) => sum + d.remainingDebt, 0);

  const submitPayment = async () => {
    if (!selectedDebt) return;
    if (paymentAmount <= 0) {
      setError("Nominal pembayaran harus lebih dari 0.");
      return;
    }
    if (paymentAmount > selectedDebt.remainingDebt) {
      setError("Nominal melebihi sisa hutang.");
      return;
    }
    try {
      setError(null);
      await createDebtPayment({
        transactionId: selectedDebt.id,
        amount: paymentAmount,
        method: paymentMethod,
      });
      setPaymentOpen(false);
      setSelectedDebt(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Gagal memproses pembayaran.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="flex flex-col justify-center">
          <CardContent className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-red-400 mb-1.5">Buku Hutang</p>
            <h2 className="text-3xl font-black text-white">Kelola piutang pelanggan.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
              Setiap hutang terikat dengan transaksi dari kasir. Catat setiap cicilan pembayaran agar riwayat kas masuk tetap akurat.
            </p>
          </CardContent>
        </Card>
        <Card className="border border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-red-500/20 blur-3xl rounded-full pointer-events-none" />
          <CardContent className="p-6 relative z-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-red-400 mb-2">Total Piutang Berjalan</p>
            <p className="text-5xl font-black text-white tracking-tight">{formatCurrency(activeTotal)}</p>
            <p className="mt-3 text-sm text-slate-400">
              Berasal dari <span className="text-white font-semibold">{debts.filter(d => d.remainingDebt > 0).length} tagihan</span> pelanggan yang belum lunas.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-2">
            {[
              { value: "belum lunas", label: "Belum Lunas" },
              { value: "lunas", label: "Sudah Lunas" },
              { value: "semua", label: "Semua Tagihan" },
            ].map((item) => (
              <Button
                key={item.value}
                variant={filter === item.value ? "default" : "outline"}
                onClick={() => setFilter(item.value as typeof filter)}
                className={cn("h-10", filter === item.value ? "glow-none border-red-500/30 text-red-400 bg-red-500/20" : "")}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4">
        {filteredDebts.length > 0 ? (
          filteredDebts.map((debt) => (
            <Card key={debt.id} className="glass-card group border-white/5 bg-white/5 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  {/* A. Customer Info Section */}
                  <div className="p-6 lg:w-1/4 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col items-center lg:items-start text-center lg:text-left">
                    <div className="relative mb-3">
                      <div className="flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400 border border-white/10 shadow-inner group-hover:border-red-500/30 transition-colors">
                        <User className="size-6" />
                      </div>
                      <div className="absolute -bottom-1 -right-1">
                        {debt.remainingDebt > 0 ? (
                          <div className="size-4 rounded-full bg-red-500 border-2 border-[#0a0a0c] shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        ) : (
                          <div className="size-4 rounded-full bg-emerald-500 border-2 border-[#0a0a0c] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white truncate w-full">{debt.customerName || "Tanpa Nama"}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{debt.customerPhone || "Tidak ada kontak"}</p>
                    
                    <div className="mt-4">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border transition-all",
                          debt.remainingDebt > 0 
                            ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                        )}
                      >
                        {debt.remainingDebt > 0 ? "Belum Lunas" : "Lunas"}
                      </Badge>
                    </div>
                  </div>

                  {/* B. Debt Summary Section */}
                  <div className="p-6 flex-1 bg-black/20 lg:bg-transparent">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sisa Tagihan</p>
                        <p className="text-3xl font-black text-red-400 tracking-tight">{formatCurrency(debt.remainingDebt)}</p>
                        
                        {/* Progress Bar */}
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-slate-500">Progres Pelunasan</span>
                            <span className="text-emerald-400">{Math.round((debt.paidAmount / debt.total) * 100)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000" 
                              style={{ width: `${(debt.paidAmount / debt.total) * 100}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {formatCurrency(debt.paidAmount)} terbayar dari {formatCurrency(debt.total)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Total Transaksi</p>
                          <p className="text-sm font-bold text-slate-300">{formatCurrency(debt.total)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">ID Transaksi</p>
                          <p className="text-sm font-bold text-slate-300">#{debt.id.slice(-6).toUpperCase()}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Tanggal Beli</p>
                          <p className="text-sm font-bold text-slate-400">{formatDate(debt.createdAt)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Jatuh Tempo</p>
                          <p className={cn("text-sm font-bold", debt.dueDate ? "text-amber-400" : "text-slate-500")}>
                            {debt.dueDate ? formatDate(debt.dueDate) : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* C. Action Area */}
                  <div className="p-6 lg:w-1/5 border-t lg:border-t-0 lg:border-l border-white/5 flex flex-row lg:flex-col gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedDebt(debt);
                        setDetailOpen(true);
                      }}
                      className="flex-1 lg:w-full h-11 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      <FileText className="size-4 mr-2 text-slate-400" />
                      Detail
                    </Button>

                    {debt.remainingDebt > 0 ? (
                      <Button 
                        onClick={() => {
                          setSelectedDebt(debt);
                          setPaymentAmount(debt.remainingDebt);
                          setPaymentMethod("Tunai");
                          setPaymentOpen(true);
                        }} 
                        disabled={isMutating}
                        className="flex-1 lg:w-full h-11 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-xs font-bold uppercase tracking-wider glow-red transition-all border-none"
                      >
                        <HandCoins className="size-4 mr-2" />
                        Bayar
                      </Button>
                    ) : (
                      <div className="flex-1 lg:w-full h-11 flex items-center justify-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                        <CheckCircle2 className="size-4" /> Lunas
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
            <HandCoins className="size-10 text-slate-600 mb-3" />
            <p className="text-base font-semibold text-white">Tidak ada data tagihan</p>
            <p className="text-sm text-slate-400 mt-1">Belum ada transaksi dengan metode pembayaran Hutang.</p>
          </div>
        )}
      </section>

      {/* MODAL: BAYAR HUTANG */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="glass-card border border-white/10 text-white p-0 sm:max-w-[450px]">
          <DialogHeader className="p-6 border-b border-white/5 bg-white/5">
            <DialogTitle className="text-xl font-bold">Bayar Hutang</DialogTitle>
            <DialogDescription className="text-slate-400 mt-1">Pembayaran akan dicatat sebagai uang masuk (cash-in).</DialogDescription>
          </DialogHeader>
          {selectedDebt && (
            <div className="p-6 grid gap-5">
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-xs uppercase tracking-wider text-red-300 font-semibold mb-1">Sisa Hutang</p>
                <p className="text-3xl font-black text-white">{formatCurrency(selectedDebt.remainingDebt)}</p>
                <p className="text-xs text-slate-400 mt-1">Pelanggan: {selectedDebt.customerName}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-slate-300 font-semibold text-xs uppercase tracking-wider">Nominal Bayar</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  min={1} 
                  max={selectedDebt.remainingDebt}
                  value={paymentAmount === 0 ? "" : paymentAmount} 
                  onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : 0)} 
                  className="bg-black/20 border-white/10 text-white h-12 text-lg font-bold" 
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300 font-semibold text-xs uppercase tracking-wider">Metode Pembayaran</Label>
                <div className="flex gap-2">
                  {["Tunai", "QRIS", "Transfer"].map((method) => (
                    <Button
                      key={method}
                      type="button"
                      variant={paymentMethod === method ? "default" : "outline"}
                      onClick={() => setPaymentMethod(method as PaymentMethod)}
                      className={cn("flex-1 h-10", paymentMethod === method ? "" : "bg-white/5 border-white/10")}
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-400 text-center font-medium bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
            </div>
          )}
          <DialogFooter className="p-6 pt-0 border-t border-white/5 bg-white/5">
            <Button variant="outline" className="border-white/10 bg-transparent hover:bg-white/10 text-white" onClick={() => setPaymentOpen(false)}>Batal</Button>
            <Button className="glow-red bg-red-600" onClick={submitPayment} disabled={isMutating}>Konfirmasi Pembayaran</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: DETAIL TRANSAKSI */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="glass-card border border-white/10 text-white p-0 sm:max-w-[500px]">
          <DialogHeader className="p-6 border-b border-white/5 bg-white/5">
            <DialogTitle className="text-xl font-bold">Detail Transaksi</DialogTitle>
            <DialogDescription className="text-slate-400 mt-1">Rincian barang dan riwayat cicilan.</DialogDescription>
          </DialogHeader>
          {selectedDebt && (
            <div className="p-0">
              <div className="p-6 border-b border-white/5 space-y-3 max-h-[250px] overflow-y-auto">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Daftar Barang Dibeli</p>
                {selectedDebt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.productName}</p>
                      <p className="text-xs text-slate-400">{item.qty} x {formatCurrency(item.sellPrice)}</p>
                    </div>
                    <p className="text-sm font-bold text-white">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
              <div className="p-6 space-y-3 bg-black/20">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Riwayat Pembayaran</p>
                {data.debtPayments.filter(dp => dp.transactionId === selectedDebt.id).length > 0 ? (
                  <div className="space-y-2">
                    {data.debtPayments
                      .filter(dp => dp.transactionId === selectedDebt.id)
                      .map((dp) => (
                        <div key={dp.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                          <div>
                            <p className="font-semibold text-emerald-400">+{formatCurrency(dp.amount)}</p>
                            <p className="text-xs text-slate-500">{formatDateTime(dp.createdAt)} via {dp.method}</p>
                          </div>
                        </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Belum ada pembayaran cicilan.</p>
                )}
                <div className="flex justify-between font-bold text-white pt-2">
                  <span>Total Tagihan Awal</span>
                  <span>{formatCurrency(selectedDebt.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
