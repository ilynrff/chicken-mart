"use client";

import { useMemo, useState } from "react";
import { BellRing, CheckCircle2, HandCoins, PlusCircle } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreateDebtInput, DebtStatus } from "@/lib/types";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

function initialDebt(): CreateDebtInput {
  return {
    customerName: "",
    phone: "",
    amount: 0,
    dueDate: new Date().toISOString().slice(0, 10),
    note: "",
  };
}

export default function HutangPage() {
  const { data, createDebt, updateDebt, isMutating } = useData();
  const [filter, setFilter] = useState<DebtStatus | "semua">("semua");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateDebtInput>(initialDebt());
  const [error, setError] = useState<string | null>(null);

  const filteredDebts = useMemo(() => {
    if (!data) return [];
    if (filter === "semua") return data.debts;
    return data.debts.filter((debt) => debt.status === filter);
  }, [data, filter]);

  if (!data) return null;

  const activeTotal = data.debts
    .filter((debt) => debt.status === "aktif")
    .reduce((sum, debt) => sum + debt.amount, 0);

  const submitDebt = async () => {
    try {
      setError(null);
      await createDebt(form);
      setOpen(false);
      setForm(initialDebt());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Gagal menyimpan hutang.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="flex flex-col justify-center">
          <CardContent className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-red-400 mb-1.5">Buku Hutang</p>
            <h2 className="text-3xl font-black text-white">Pantau kasbon pelanggan.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
              Reminder masih manual, jadi halaman ini menyorot jatuh tempo, total kasbon aktif, dan riwayat pengingat.
            </p>
          </CardContent>
        </Card>
        <Card className="border border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-red-500/20 blur-3xl rounded-full pointer-events-none" />
          <CardContent className="p-6 relative z-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-red-400 mb-2">Kasbon Aktif</p>
            <p className="text-5xl font-black text-white tracking-tight">{formatCurrency(activeTotal)}</p>
            <p className="mt-3 text-sm text-slate-400">
              <span className="text-white font-semibold">{data.debts.filter((debt) => debt.status === "aktif").length} pelanggan</span> belum lunas.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { value: "semua", label: "Semua" },
              { value: "aktif", label: "Aktif" },
              { value: "lunas", label: "Lunas" },
            ].map((item) => (
              <Button
                key={item.value}
                variant={filter === item.value ? "default" : "outline"}
                onClick={() => setFilter(item.value as DebtStatus | "semua")}
                className="h-10"
              >
                {item.label}
              </Button>
            ))}
          </div>

          <Button
            size="default"
            className="h-10"
            onClick={() => {
              setError(null);
              setForm(initialDebt());
              setOpen(true);
            }}
          >
            <PlusCircle className="size-4 mr-2" />
            Tambah Hutang
          </Button>
        </CardContent>
      </Card>

      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-400">{error}</div> : null}

      <section className="grid gap-4">
        {filteredDebts.map((debt) => (
          <Card key={debt.id} className="glass-card-hover group border-white/5 bg-white/5">
            <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold text-white">{debt.customerName}</h3>
                  <Badge variant={debt.status === "aktif" ? "warning" : "success"}>
                    {debt.status === "aktif" ? "Belum lunas" : "Lunas"}
                  </Badge>
                </div>
                <div className="grid gap-3 rounded-xl bg-black/20 border border-white/5 p-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Nominal</p>
                    <p className="font-bold text-white mt-0.5">{formatCurrency(debt.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Jatuh tempo</p>
                    <p className="font-semibold text-slate-300 mt-0.5">{formatDate(debt.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">No. kontak</p>
                    <p className="font-semibold text-slate-300 mt-0.5">{debt.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Reminder</p>
                    <p className="font-semibold text-slate-300 mt-0.5">{debt.reminderCount} kali</p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Catatan</p>
                  <p className="text-sm leading-relaxed text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">{debt.note || "Tidak ada catatan."}</p>
                </div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Update terakhir {formatDateTime(debt.updatedAt)}</p>
              </div>

              <div className="flex flex-wrap gap-2 lg:w-48 lg:flex-col mt-2 lg:mt-0">
                <Button
                  variant="outline"
                  onClick={() => updateDebt(debt.id, { reminderCount: debt.reminderCount + 1 })}
                  disabled={isMutating}
                  className="w-full justify-start"
                >
                  <BellRing className="size-4 mr-2" />
                  Catat reminder
                </Button>
                {debt.status === "aktif" ? (
                  <Button 
                    onClick={() => updateDebt(debt.id, { status: "lunas" })} 
                    disabled={isMutating}
                    variant="secondary"
                    className="w-full justify-start hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                  >
                    <CheckCircle2 className="size-4 mr-2" />
                    Tandai lunas
                  </Button>
                ) : (
                  <Button variant="ghost" disabled className="w-full justify-start border border-dashed border-white/10 opacity-50">
                    <HandCoins className="size-4 mr-2" />
                    Sudah lunas
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><span className="hidden" /></DialogTrigger>
        <DialogContent className="glass-card border border-white/10 text-white p-0 sm:max-w-[500px]">
          <DialogHeader className="p-6 border-b border-white/5 bg-white/5">
            <DialogTitle className="text-xl font-bold">Tambah Data Hutang</DialogTitle>
            <DialogDescription className="text-slate-400 mt-1">Simpan kasbon baru dengan nominal, jatuh tempo, dan catatan singkat.</DialogDescription>
          </DialogHeader>
          <div className="p-6 grid gap-5">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-slate-300">Nama pelanggan</Label>
              <Input id="customerName" value={form.customerName} onChange={(e) => setForm(c => ({ ...c, customerName: e.target.value }))} className="bg-black/20 border-white/10 text-white" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">No. kontak</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm(c => ({ ...c, phone: e.target.value }))} className="bg-black/20 border-white/10 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-slate-300">Nominal hutang</Label>
                <Input id="amount" type="number" min={0} value={form.amount === 0 ? "" : form.amount} onChange={(e) => setForm(c => ({ ...c, amount: e.target.value ? Number(e.target.value) : 0 }))} className="bg-black/20 border-white/10 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-slate-300">Jatuh tempo</Label>
              <Input id="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm(c => ({ ...c, dueDate: e.target.value }))} className="bg-black/20 border-white/10 text-white [color-scheme:dark]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note" className="text-slate-300">Catatan</Label>
              <Textarea id="note" value={form.note} onChange={(e) => setForm(c => ({ ...c, note: e.target.value }))} className="bg-black/20 border-white/10 text-white min-h-[80px]" />
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 border-t border-white/5 bg-white/5">
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={submitDebt} disabled={isMutating}>Simpan hutang</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
