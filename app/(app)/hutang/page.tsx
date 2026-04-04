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
    if (!data) {
      return [];
    }

    if (filter === "semua") {
      return data.debts;
    }

    return data.debts.filter((debt) => debt.status === filter);
  }, [data, filter]);

  if (!data) {
    return null;
  }

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
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">Buku hutang</p>
            <h2 className="mt-2 text-3xl font-black">Pantau kasbon pelanggan dan tindak lanjut penagihannya.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Reminder masih manual, jadi halaman ini menyorot jatuh tempo, total kasbon aktif, dan riwayat pengingat.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-lime-500 text-white">
          <CardContent className="p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-white/80">Kasbon aktif</p>
            <p className="mt-4 text-5xl font-black">{formatCurrency(activeTotal)}</p>
            <p className="mt-3 text-sm leading-7 text-white/85">
              {data.debts.filter((debt) => debt.status === "aktif").length} pelanggan belum lunas.
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
              >
                {item.label}
              </Button>
            ))}
          </div>

          <Button
            size="lg"
            onClick={() => {
              setError(null);
              setForm(initialDebt());
              setOpen(true);
            }}
          >
            <PlusCircle className="size-4" />
            Tambah Hutang
          </Button>
        </CardContent>
      </Card>

      {error ? <div className="rounded-[20px] bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <section className="grid gap-4">
        {filteredDebts.map((debt) => (
          <Card key={debt.id}>
            <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold">{debt.customerName}</h3>
                  <Badge variant={debt.status === "aktif" ? "warning" : "success"}>
                    {debt.status === "aktif" ? "Belum lunas" : "Lunas"}
                  </Badge>
                </div>
                <div className="grid gap-3 rounded-[24px] bg-secondary/45 p-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nominal</p>
                    <p className="font-semibold">{formatCurrency(debt.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jatuh tempo</p>
                    <p className="font-semibold">{formatDate(debt.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">No. kontak</p>
                    <p className="font-semibold">{debt.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reminder</p>
                    <p className="font-semibold">{debt.reminderCount} kali</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Catatan</p>
                  <p className="mt-1 text-sm leading-6">{debt.note || "Tidak ada catatan."}</p>
                </div>
                <p className="text-xs text-muted-foreground">Update terakhir {formatDateTime(debt.updatedAt)}</p>
              </div>

              <div className="flex flex-wrap gap-2 lg:w-52 lg:flex-col">
                <Button
                  variant="outline"
                  onClick={() => updateDebt(debt.id, { reminderCount: debt.reminderCount + 1 })}
                  disabled={isMutating}
                >
                  <BellRing className="size-4" />
                  Catat reminder
                </Button>
                {debt.status === "aktif" ? (
                  <Button onClick={() => updateDebt(debt.id, { status: "lunas" })} disabled={isMutating}>
                    <CheckCircle2 className="size-4" />
                    Tandai lunas
                  </Button>
                ) : (
                  <Button variant="secondary" disabled>
                    <HandCoins className="size-4" />
                    Sudah selesai
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span className="hidden" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah data hutang</DialogTitle>
            <DialogDescription>
              Simpan kasbon baru dengan nominal, jatuh tempo, dan catatan singkat.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nama pelanggan</Label>
              <Input
                id="customerName"
                value={form.customerName}
                onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">No. kontak</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Nominal hutang</Label>
                <Input
                  id="amount"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.amount === 0 ? "" : String(form.amount)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      amount: event.target.value === "" ? 0 : Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Jatuh tempo</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Catatan</Label>
              <Textarea
                id="note"
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={submitDebt} disabled={isMutating}>
              Simpan hutang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
