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
import { toast } from "sonner";

function buildForm(defaultMinimumStock: number, defaultCategory = "Sembako"): ProductInput {
  return { name: "", category: defaultCategory, buyPrice: 0, sellPrice: 0, stock: 0, minimumStock: defaultMinimumStock };
}

export default function InventarisPage() {
  const { data, createProduct, updateProduct, restockProduct, createCategory, deleteCategory, isMutating } = useData();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catError, setCatError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductInput>(buildForm(8));

  const categoryOptions = useMemo(() => {
    if (!data) return [];
    return (data.categories || []).map(c => c.name);
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
      if (editingProduct) {
        await updateProduct(editingProduct.id, form);
        toast.success(`Berhasil memperbarui ${form.name}`);
      } else {
        await createProduct(form);
        toast.success(`Berhasil menambahkan ${form.name}`);
      }
      setFormOpen(false);
    } catch (caughtError) {
      const msg = caughtError instanceof Error ? caughtError.message : "Gagal menyimpan produk.";
      setError(msg);
      toast.error(msg);
    }
  };

  const submitRestock = async () => {
    if (!restockTarget) return;
    try {
      setError(null);
      await restockProduct(restockTarget.id, restockQty);
      toast.success(`Berhasil menambah stok ${restockTarget.name}`);
      setRestockOpen(false);
      setRestockQty(10);
      setRestockTarget(null);
    } catch (caughtError) {
      const msg = caughtError instanceof Error ? caughtError.message : "Gagal restock produk.";
      setError(msg);
      toast.error(msg);
    }
  };

  const submitCategory = async () => {
    try {
      setCatError(null);
      const newCat = await createCategory({ name: catName });
      setForm(c => ({ ...c, category: newCat.name }));
      setCatOpen(false);
      setCatName("");
    } catch (caughtError) {
      setCatError(caughtError instanceof Error ? caughtError.message : "Gagal menyimpan kategori.");
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
                      <CardTitle className="text-white text-base leading-snug truncate">{product.name}</CardTitle>
                      <div className="mt-2">
                        <Badge variant="outline" className="bg-red-500/5 text-red-400 border-red-500/20 text-[10px] font-black uppercase tracking-wider py-0.5">
                          {product.category}
                        </Badge>
                      </div>
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
        <DialogContent className="glass-card border border-white/10 text-white p-0 overflow-hidden sm:max-w-[520px] rounded-3xl">
          <DialogHeader className="p-8 pb-6 bg-gradient-to-b from-white/[0.08] to-transparent">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <PackagePlus className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight">{editingProduct ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle>
                <DialogDescription className="text-slate-400 mt-1 text-sm font-medium">Simpan data produk lengkap agar kasir dan laporan sinkron.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-8 pb-8 space-y-8">
            {/* Section A: Informasi Produk */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/80">Informasi Produk</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="product-name" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Nama produk</Label>
                  <Input 
                    id="product-name" 
                    placeholder="Contoh: Ayam Broiler"
                    value={form.name} 
                    onChange={(e) => setForm(c => ({ ...c, name: e.target.value }))} 
                    className="h-10 bg-white/5 border-white/10 text-white focus:bg-white/[0.08] focus:border-red-500/40 transition-all placeholder:text-slate-600" 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="product-category" className="text-xs font-bold uppercase tracking-wider text-slate-400">Kategori</Label>
                    <button 
                      type="button" 
                      onClick={() => setCatOpen(true)}
                      className="text-[10px] font-black uppercase text-red-400 hover:text-red-300 transition-colors"
                    >
                      + Tambah kategori
                    </button>
                  </div>
                  <div className="relative">
                    {categoryOptions.length > 0 ? (
                      <>
                        <select 
                          id="product-category" 
                          value={form.category} 
                          onChange={(e) => setForm(c => ({ ...c, category: e.target.value }))} 
                          className="flex h-10 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 pr-11 text-sm text-white focus:outline-none focus:border-red-500/40 focus:bg-white/[0.08] transition-all"
                        >
                          {!form.category && <option value="" disabled>Pilih kategori</option>}
                          {categoryOptions.map(option => <option key={option} value={option} className="bg-slate-900 text-white">{option}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                      </>
                    ) : (
                      <div 
                        onClick={() => setCatOpen(true)}
                        className="flex h-10 w-full items-center justify-between rounded-xl border border-dashed border-white/10 bg-white/5 px-4 text-xs text-slate-500 cursor-pointer hover:bg-white/10 transition-all"
                      >
                        <span>Belum ada kategori</span>
                        <span className="text-red-400 font-bold">+ Buat pertama</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section B: Harga & Inventaris */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/80">Harga & Inventaris</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="buy-price" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Harga beli</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">Rp</span>
                    <Input 
                      id="buy-price" 
                      type="number" 
                      value={form.buyPrice === 0 ? "" : form.buyPrice} 
                      onChange={(e) => setForm(c => ({ ...c, buyPrice: e.target.value ? Number(e.target.value) : 0 }))} 
                      className="h-10 pl-11 bg-white/5 border-white/10 text-white focus:bg-white/[0.08] focus:border-red-500/40 transition-all" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sell-price" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Harga jual</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">Rp</span>
                    <Input 
                      id="sell-price" 
                      type="number" 
                      value={form.sellPrice === 0 ? "" : form.sellPrice} 
                      onChange={(e) => setForm(c => ({ ...c, sellPrice: e.target.value ? Number(e.target.value) : 0 }))} 
                      className="h-10 pl-11 bg-white/5 border-white/10 text-white focus:bg-white/[0.08] focus:border-red-500/40 transition-all font-bold text-emerald-400" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Stok Awal</Label>
                  <Input 
                    id="stock" 
                    type="number" 
                    value={form.stock === 0 ? "" : form.stock} 
                    onChange={(e) => setForm(c => ({ ...c, stock: e.target.value ? Number(e.target.value) : 0 }))} 
                    className="h-10 bg-white/5 border-white/10 text-white focus:bg-white/[0.08] focus:border-red-500/40 transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum-stock" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Minimum stok</Label>
                  <Input 
                    id="minimum-stock" 
                    type="number" 
                    value={form.minimumStock === 0 ? "" : form.minimumStock} 
                    onChange={(e) => setForm(c => ({ ...c, minimumStock: e.target.value ? Number(e.target.value) : 0 }))} 
                    className="h-10 bg-white/5 border-white/10 text-white focus:bg-white/[0.08] focus:border-red-500/40 transition-all" 
                  />
                </div>
              </div>
            </div>
            
            {error && <p className="text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-2 rounded-lg">{error}</p>}
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-3 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setFormOpen(false)}
              className="h-11 px-6 rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            >
              Batal
            </Button>
            <Button 
              onClick={submitForm} 
              disabled={isMutating}
              className="h-11 px-8 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold shadow-[0_4px_15px_rgba(220,38,38,0.3)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.4)] hover:translate-y-[-1px] active:translate-y-[0] transition-all"
            >
              {editingProduct ? "Simpan Perubahan" : "Tambah Produk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogTrigger asChild><span className="hidden" /></DialogTrigger>
        <DialogContent className="glass-card border border-white/10 text-white p-0 overflow-hidden sm:max-w-[420px] rounded-3xl">
          <DialogHeader className="p-8 pb-6 bg-gradient-to-b from-white/[0.08] to-transparent">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                <RefreshCw className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight">Restock Produk</DialogTitle>
                <DialogDescription className="text-slate-400 mt-1 text-sm font-medium">Tambahkan stok untuk {restockTarget?.name ?? "produk terpilih"}.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-8 pb-8 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="restock-qty" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Jumlah masuk (item)</Label>
              <div className="relative">
                <Input 
                  id="restock-qty" 
                  type="number" 
                  min={1} 
                  value={restockQty || ""} 
                  onChange={(e) => setRestockQty(e.target.value ? Number(e.target.value) : 0)} 
                  className="h-14 bg-white/5 border-white/10 text-white text-2xl font-black text-center focus:bg-white/[0.08] focus:border-blue-500/40 transition-all rounded-2xl" 
                />
              </div>
              <p className="text-[11px] text-center text-slate-500 font-medium italic">Stok akan otomatis ditambahkan ke saldo inventaris.</p>
            </div>
            
            {error && <p className="text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-2 rounded-lg">{error}</p>}
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-3 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setRestockOpen(false)}
              className="h-11 px-6 rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            >
              Batal
            </Button>
            <Button 
              onClick={submitRestock} 
              disabled={isMutating || restockQty <= 0}
              className="h-11 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-[0_4px_15px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] hover:translate-y-[-1px] active:translate-y-[0] transition-all disabled:opacity-50 disabled:translate-y-0"
            >
              {isMutating ? "Menyimpan..." : "Simpan Restock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="glass-card border border-white/10 text-white p-0 overflow-hidden sm:max-w-[400px] rounded-3xl">
          <DialogHeader className="p-8 pb-6 bg-gradient-to-b from-white/[0.08] to-transparent">
            <DialogTitle className="text-xl font-black tracking-tight">Tambah Kategori</DialogTitle>
            <DialogDescription className="text-slate-400 mt-1 text-sm font-medium">Buat kategori baru untuk mengelompokkan produk Anda.</DialogDescription>
          </DialogHeader>
          <div className="px-8 pb-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Nama Kategori</Label>
              <Input 
                id="cat-name" 
                placeholder="Contoh: Frozen Food"
                value={catName} 
                onChange={(e) => setCatName(e.target.value)} 
                className="h-11 bg-white/5 border-white/10 text-white focus:bg-white/[0.08] focus:border-red-500/40 transition-all placeholder:text-slate-600" 
              />
            </div>
            {catError && <p className="text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-2 rounded-lg">{catError}</p>}
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-3 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setCatOpen(false)}
              className="h-11 px-6 rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            >
              Batal
            </Button>
            <Button 
              onClick={submitCategory} 
              disabled={isMutating || !catName.trim()}
              className="h-11 px-8 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold shadow-[0_4px_15px_rgba(220,38,38,0.3)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.4)] transition-all"
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
