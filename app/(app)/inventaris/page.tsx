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
  return {
    name: "",
    category: defaultCategory,
    buyPrice: 0,
    sellPrice: 0,
    stock: 0,
    minimumStock: defaultMinimumStock,
  };
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
    if (!data) {
      return ["Sembako", "Frozen Food", "Makanan Kering", "Minuman", "Kebutuhan Rumah Tangga", "Lainnya"];
    }

    return [
      ...new Set([
        ...data.products.map((product) => product.category),
        "Sembako",
        "Frozen Food",
        "Makanan Kering",
        "Minuman",
        "Kebutuhan Rumah Tangga",
        "Lainnya",
      ]),
    ];
  }, [data]);

  const filteredProducts = useMemo(() => {
    if (!data) {
      return [];
    }

    const term = query.toLowerCase();
    return data.products.filter((product) => {
      if (!term) {
        return true;
      }

      return product.name.toLowerCase().includes(term) || product.category.toLowerCase().includes(term);
    });
  }, [data, query]);

  if (!data) {
    return null;
  }

  const openCreate = () => {
    setEditingProduct(null);
    setForm(buildForm(data.settings.defaultMinimumStock, categoryOptions[0] ?? "Sembako"));
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      stock: product.stock,
      minimumStock: product.minimumStock,
    });
    setError(null);
    setFormOpen(true);
  };

  const submitForm = async () => {
    try {
      setError(null);
      if (editingProduct) {
        await updateProduct(editingProduct.id, form);
      } else {
        await createProduct(form);
      }
      setFormOpen(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Gagal menyimpan produk.");
    }
  };

  const submitRestock = async () => {
    if (!restockTarget) {
      return;
    }

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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">Inventaris</p>
            <h2 className="mt-2 text-3xl font-black">Kelola produk, harga, stok, dan restock harian.</h2>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full pl-11 lg:w-80"
              placeholder="Cari nama atau kategori"
            />
          </div>
          <Button size="lg" onClick={openCreate}>
            <PackagePlus className="size-4" />
            Tambah Produk
          </Button>
        </CardContent>
      </Card>

      {error ? <div className="rounded-[20px] bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product) => {
          const isLow = product.stock <= product.minimumStock;
          return (
            <Card key={product.id}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription className="mt-2">{product.category}</CardDescription>
                  </div>
                  <Badge variant={isLow ? "warning" : "success"}>{product.stock} stok</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 rounded-[24px] bg-secondary/50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Harga jual</p>
                    <p className="font-semibold">{formatCurrency(product.sellPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Harga beli</p>
                    <p className="font-semibold">{formatCurrency(product.buyPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Minimum stok</p>
                    <p className="font-semibold">{product.minimumStock}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Update terakhir</p>
                    <p className="font-semibold">{formatDateTime(product.updatedAt)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => openEdit(product)}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setRestockTarget(product);
                      setRestockQty(10);
                      setRestockOpen(true);
                    }}
                  >
                    <RefreshCw className="size-4" />
                    Restock
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogTrigger asChild>
          <span className="hidden" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit produk" : "Tambah produk baru"}</DialogTitle>
            <DialogDescription>
              Simpan data produk lengkap agar kasir dan laporan tetap sinkron.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nama produk</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-category">Kategori</Label>
              <div className="relative">
                <select
                  id="product-category"
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  className="flex h-11 w-full appearance-none rounded-2xl border border-input bg-white px-4 pr-11 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="buy-price">Harga beli</Label>
                <Input
                  id="buy-price"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.buyPrice === 0 ? "" : String(form.buyPrice)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      buyPrice: event.target.value === "" ? 0 : Number(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sell-price">Harga jual</Label>
                <Input
                  id="sell-price"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.sellPrice === 0 ? "" : String(form.sellPrice)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sellPrice: event.target.value === "" ? 0 : Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stock">Stok</Label>
                <Input
                  id="stock"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  hideSpinButtons={false}
                  value={form.stock}
                  onChange={(event) => setForm((current) => ({ ...current, stock: Number(event.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimum-stock">Minimum stok</Label>
                <Input
                  id="minimum-stock"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  hideSpinButtons={false}
                  value={form.minimumStock}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, minimumStock: Number(event.target.value) }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button onClick={submitForm} disabled={isMutating}>
              {editingProduct ? "Simpan perubahan" : "Tambah produk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogTrigger asChild>
          <span className="hidden" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock produk</DialogTitle>
            <DialogDescription>
              Tambahkan jumlah stok untuk {restockTarget?.name ?? "produk terpilih"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="restock-qty">Jumlah restock</Label>
            <Input
              id="restock-qty"
              type="number"
              inputMode="numeric"
              min={1}
              hideSpinButtons={false}
              value={restockQty}
              onChange={(event) => setRestockQty(Number(event.target.value))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockOpen(false)}>
              Batal
            </Button>
            <Button onClick={submitRestock} disabled={isMutating}>
              Simpan restock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
