"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingCart, Store, Tag, Trash2, Minus, Plus } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PaymentMethod, Product } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type CartLine = {
  product: Product;
  qty: number;
  subtotal: number;
};

export default function KasirPage() {
  const { data, createTransaction, isMutating } = useData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Tunai");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!data) {
      return;
    }

    const firstMethod = data.settings.enabledPaymentMethods[0] ?? "Tunai";
    if (!data.settings.enabledPaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(firstMethod);
    }
  }, [data, paymentMethod]);

  const categories = useMemo(
    () => ["Semua", ...new Set(data?.products.map((product) => product.category) ?? [])],
    [data],
  );

  const filteredProducts = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.products.filter((product) => {
      const matchesCategory = category === "Semua" || product.category === category;
      const term = query.toLowerCase();
      const matchesQuery =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term);

      return matchesCategory && matchesQuery;
    });
  }, [category, data, query]);

  const cartItems = useMemo<CartLine[]>(() => {
    if (!data) {
      return [];
    }

    return Object.entries(cart)
      .map(([productId, qty]) => {
        const product = data.products.find((item) => item.id === productId);
        if (!product || qty <= 0) {
          return null;
        }

        return {
          product,
          qty,
          subtotal: qty * product.sellPrice,
        };
      })
      .filter((value): value is CartLine => Boolean(value));
  }, [cart, data]);

  const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const invalidItem = cartItems.find((item) => item.qty > item.product.stock);

  if (!data) {
    return null;
  }

  const addToCart = (productId: string) => {
    setError(null);
    setSuccess(null);
    setCart((current) => ({
      ...current,
      [productId]: (current[productId] ?? 0) + 1,
    }));
  };

  const updateQty = (productId: string, nextQty: number) => {
    setCart((current) => {
      if (nextQty <= 0) {
        const copy = { ...current };
        delete copy[productId];
        return copy;
      }

      return {
        ...current,
        [productId]: nextQty,
      };
    });
  };

  const handleCheckout = async () => {
    if (!cartItems.length) {
      setError("Keranjang masih kosong.");
      return;
    }

    if (invalidItem) {
      setError(`Stok ${invalidItem.product.name} tidak cukup untuk checkout.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const transaction = await createTransaction({
        items: cartItems.map((item) => ({
          productId: item.product.id,
          qty: item.qty,
        })),
        paymentMethod,
      });
      setCart({});
      setSuccess(`Checkout berhasil. Total transaksi ${formatCurrency(transaction.total)}.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Checkout gagal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 xl:h-[calc(100vh-5.25rem)] xl:grid-cols-[1fr_0.95fr] xl:items-start">
      <div className="space-y-6 xl:flex xl:min-h-0 xl:flex-col xl:overflow-hidden">
        <Card className="overflow-hidden">
          <CardContent className="grid gap-4 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-primary to-red-400 text-primary-foreground shadow-lg ring-1 ring-red-200/60">
                <Store className="size-7" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">Kasir</p>
                <h2 className="mt-1 text-3xl font-black">Pilih barang, atur jumlah, lalu checkout cepat.</h2>
              </div>
            </div>
            <div className="rounded-[24px] bg-secondary/70 px-4 py-3 text-sm text-muted-foreground lg:min-w-64">
              Metode aktif: {data.settings.enabledPaymentMethods.join(", ")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Search className="size-4 text-primary" />
                Cari produk
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari nama barang atau kategori"
                  className="h-12 rounded-[20px] pl-11"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant={category === item ? "default" : "outline"}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <section className="grid auto-rows-fr gap-2.5 sm:grid-cols-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-2 2xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const isLow = product.stock <= product.minimumStock;
            return (
              <Card key={product.id} className="h-full overflow-hidden rounded-[20px] border border-red-100/70 shadow-sm">
                <CardContent className="flex h-full flex-col gap-2.5 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/70">
                        {product.category}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-5">{product.name}</h3>
                    </div>
                    <Tag className="mt-0.5 size-3.5 shrink-0 text-primary/50" />
                  </div>

                  <p className="text-lg font-black leading-none text-primary">{formatCurrency(product.sellPrice)}</p>

                  <div className="flex items-center justify-between gap-2 text-xs">
                    <Badge variant={isLow ? "warning" : "success"}>Stok {product.stock}</Badge>
                    <span className="text-muted-foreground">Min {product.minimumStock}</span>
                  </div>

                  <Button
                    className="mt-auto h-9 w-full rounded-xl px-3 text-sm"
                    onClick={() => addToCart(product.id)}
                    disabled={product.stock === 0}
                  >
                    <Plus className="size-3.5" />
                    {product.stock === 0 ? "Stok habis" : "Tambah"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>

      <Card className="h-fit xl:flex xl:h-[calc(100vh-5.25rem)] xl:min-h-0 xl:flex-col xl:overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="size-5 text-primary" />
            Keranjang
          </CardTitle>
          <CardDescription>{cartItems.length} item aktif untuk transaksi ini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
          <div className="space-y-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-2">
            {cartItems.length ? (
              cartItems.map((item) => (
                <div key={item.product.id} className="min-h-[132px] rounded-[24px] bg-secondary/55 px-4 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <p className="font-semibold leading-6">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(item.product.sellPrice)} / item</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => updateQty(item.product.id, 0)}>
                      <Trash2 className="size-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="mt-6 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-2 py-1.5 shadow-sm">
                      <Button variant="ghost" size="icon" onClick={() => updateQty(item.product.id, item.qty - 1)}>
                        <Minus className="size-4" />
                      </Button>
                      <span className="min-w-8 text-center font-semibold">{item.qty}</span>
                      <Button variant="ghost" size="icon" onClick={() => updateQty(item.product.id, item.qty + 1)}>
                        <Plus className="size-4" />
                      </Button>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                      <p
                        className={cn(
                          "text-xs",
                          item.qty > item.product.stock ? "text-red-600" : "text-muted-foreground",
                        )}
                      >
                        Sisa stok: {item.product.stock}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border bg-secondary/35 p-5 text-sm text-muted-foreground">
                Belum ada item. Tap produk di sebelah kiri untuk mulai transaksi.
              </div>
            )}
          </div>

          <div className="rounded-[24px] bg-white/90 p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Metode pembayaran</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.settings.enabledPaymentMethods.map((method) => (
                <Button
                  key={method}
                  type="button"
                  variant={paymentMethod === method ? "default" : "outline"}
                  onClick={() => setPaymentMethod(method)}
                >
                  {method}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] bg-primary/5 p-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total item</span>
              <span>{cartItems.reduce((sum, item) => sum + item.qty, 0)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-base font-semibold">Total bayar</span>
              <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {error ? <div className="rounded-[20px] bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
          {success ? <div className="rounded-[20px] bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div> : null}

          <Button
            size="lg"
            className="w-full"
            onClick={handleCheckout}
            disabled={isSubmitting || isMutating || !cartItems.length || Boolean(invalidItem)}
          >
            <ShoppingCart className="size-4" />
            {isSubmitting ? "Memproses checkout..." : "Checkout sekarang"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
