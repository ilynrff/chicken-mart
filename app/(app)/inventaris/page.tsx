"use client";

import { useMemo, useState } from "react";
import { ChevronDown, PackagePlus, Pencil, RefreshCw, Search } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product, ProductInput } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

function buildForm(defaultMinimumStock: number, defaultCategory = "Sembako"): ProductInput {
  return { name: "", category: defaultCategory, buyPrice: 0, sellPrice: 0, stock: 0, minimumStock: defaultMinimumStock };
}

export default function InventarisPage() {
  const { data, createProduct, updateProduct, restockProduct, isMutating } = useData();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductInput>(buildForm(8));

  const categoryOptions = useMemo(() => {
    if (!data) return ["Sembako", "Frozen Food", "Makanan Kering", "Minuman", "Kebutuhan Rumah Tangga", "Lainnya"];
    return [...new Set([...data.products.map((product) => product.category), "Sembako", "Frozen Food", "Makanan Kering", "Minuman", "Kebutuhan Rumah Tangga", "Lainnya"])];
  }, [data]);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    const term = query.toLowerCase();
    return data.products.filter((product) => !term || product.name.toLowerCase().includes(term) || product.category.toLowerCase().includes(term));
  }, [data, query]);

  if (!data) return null;

  const openCreate = () => {
    setEditingProduct(null);
    setForm(buildForm(data.settings.defaultMinimumStock, categoryOptions[0] ?? "Sembako"));
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({ ...product });
    setError(null);
    setFormOpen(true);
  };

  const submitForm = async () => {
    try {
      setError(null);
      if (editingProduct) await updateProduct(editingProduct.id, form);
      else await createProduct(form);
      setFormOpen(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Gagal menyimpan produk.");
    }
  };

  const submitRestock = async () => {
    if (!restockTarget) return;
    try {
      setError(null);
      await restockProduct(restockTarget.id, restockQty);
      setRestockOpen(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Gagal restock produk.");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 p-6 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-red-400 mb-1.5">Inventaris</p>
            <h2 className="text-3xl font-black text-white">Kelola produk, stok, dan harga.</h2>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full pl-11 lg:w-80 h-11 bg-black/20 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-red-500/50"
              placeholder="Cari nama atau kategori"
            />
          </div>
          <Button size="default" onClick={openCreate} className="h-11">
            <PackagePlus className="size-4 mr-2" />
            Tambah Produk
          </Button>
        </CardContent>
      </Card>

      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-400">{error}</div> : null}

      {filteredProducts.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => {
            const isLow = product.stock <= product.minimumStock;
            return (
              <Card key={product.id} className="glass-card-hover group border-white/5 overflow-hidden flex flex-col">
                <CardHeader className="pb-4 border-b border-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-white text-base leading-snug">{product.name}</CardTitle>
                      <CardDescription className="mt-1 text-slate-400 text-xs font-medium uppercase tracking-wider">{product.category}</CardDescription>
                    </div>
                    <Badge variant={isLow ? "warning" : "success"} className="shrink-0">{product.stock} stok</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex flex-col flex-1">
                  <div className="grid gap-3 grid-cols-2 rounded-xl bg-black/20 border border-white/5 p-4 mb-5">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Harga Jual</p>
                      <p className="font-bold text-white mt-0.5">{formatCurrency(product.sellPrice)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Harga Beli</p>
                      <p className="font-semibold text-slate-300 mt-0.5">{formatCurrency(product.buyPrice)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Min Stok</p>
                      <p className="font-semibold text-slate-300 mt-0.5">{product.minimumStock}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Updated</p>
                      <p className="font-semibold text-slate-300 mt-0.5 text-xs">{formatDateTime(product.updatedAt).split(',')[0]}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Button variant="outline" className="flex-1" onClick={() => openEdit(product)}>
                      <Pencil className="size-3.5 mr-2" /> Edit
                    </Button>
                    <Button variant="secondary" className="flex-1" onClick={() => { setRestockTarget(product); setRestockQty(10); setRestockOpen(true); }}>
                      <RefreshCw className="size-3.5 mr-2" /> Restock
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-panel rounded-2xl border border-white/10 mt-4">
          <div className="rounded-full bg-white/5 p-4 mb-3 border border-white/10">
            <PackagePlus className="size-6 text-slate-500" />
          </div>
          <p className="text-sm font-medium text-white">Belum ada produk</p>
          <p className="text-xs text-slate-400 mt-1 mb-4 max-w-sm">Anda belum menambahkan produk apa pun ke dalam inventaris warung Anda.</p>
          <Button size="sm" onClick={openCreate}>
            Tambah Produk Pertama
          </Button>
        </div>
      )}

      {/* DIALOGS */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogTrigger asChild><span className="hidden" /></DialogTrigger>
        <DialogContent className="glass-card border border-white/10 text-white p-0 overflow-hidden sm:max-w-[500px]">
          <DialogHeader className="p-6 border-b border-white/5 bg-white/5">
            <DialogTitle className="text-xl font-bold">{editingProduct ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle>
            <DialogDescription className="text-slate-400 mt-1">Simpan data produk lengkap agar kasir dan laporan sinkron.</DialogDescription>
          </DialogHeader>
          <div className="p-6 grid gap-5">
            <div className="space-y-2">
              <Label htmlFor="product-name" className="text-slate-300">Nama produk</Label>
              <Input id="product-name" value={form.name} onChange={(e) => setForm(c => ({ ...c, name: e.target.value }))} className="bg-black/20 border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-category" className="text-slate-300">Kategori</Label>
              <div className="relative">
                <select id="product-category" value={form.category} onChange={(e) => setForm(c => ({ ...c, category: e.target.value }))} className="flex h-11 w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-4 pr-11 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                  {categoryOptions.map(option => <option key={option} value={option} className="bg-slate-900 text-white">{option}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="buy-price" className="text-slate-300">Harga beli</Label>
                <Input id="buy-price" type="number" value={form.buyPrice === 0 ? "" : form.buyPrice} onChange={(e) => setForm(c => ({ ...c, buyPrice: e.target.value ? Number(e.target.value) : 0 }))} className="bg-black/20 border-white/10 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sell-price" className="text-slate-300">Harga jual</Label>
                <Input id="sell-price" type="number" value={form.sellPrice === 0 ? "" : form.sellPrice} onChange={(e) => setForm(c => ({ ...c, sellPrice: e.target.value ? Number(e.target.value) : 0 }))} className="bg-black/20 border-white/10 text-white" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-slate-300">Stok</Label>
                <Input id="stock" type="number" value={form.stock} onChange={(e) => setForm(c => ({ ...c, stock: Number(e.target.value) }))} className="bg-black/20 border-white/10 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimum-stock" className="text-slate-300">Minimum stok</Label>
                <Input id="minimum-stock" type="number" value={form.minimumStock} onChange={(e) => setForm(c => ({ ...c, minimumStock: Number(e.target.value) }))} className="bg-black/20 border-white/10 text-white" />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 border-t border-white/5 bg-white/5 mt-auto">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={submitForm} disabled={isMutating}>{editingProduct ? "Simpan perubahan" : "Tambah produk"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogTrigger asChild><span className="hidden" /></DialogTrigger>
        <DialogContent className="glass-card border border-white/10 text-white p-0 sm:max-w-[400px]">
          <DialogHeader className="p-6 border-b border-white/5 bg-white/5">
            <DialogTitle className="text-xl font-bold">Restock produk</DialogTitle>
            <DialogDescription className="text-slate-400 mt-1">Tambahkan stok untuk {restockTarget?.name ?? "produk terpilih"}.</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-3">
            <Label htmlFor="restock-qty" className="text-slate-300">Jumlah masuk (item)</Label>
            <Input id="restock-qty" type="number" min={1} value={restockQty} onChange={(e) => setRestockQty(Number(e.target.value))} className="bg-black/20 border-white/10 text-white text-lg h-12" />
          </div>
          <DialogFooter className="p-6 pt-0 border-t border-white/5 bg-white/5">
            <Button variant="outline" onClick={() => setRestockOpen(false)}>Batal</Button>
            <Button onClick={submitRestock} disabled={isMutating}>Simpan Restock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
