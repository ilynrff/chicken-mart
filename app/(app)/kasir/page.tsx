"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Store,
  Trash2,
} from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    if (!data) return;
    const firstMethod = data.settings.enabledPaymentMethods[0] ?? "Tunai";
    if (!data.settings.enabledPaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(firstMethod);
    }
  }, [data, paymentMethod]);

  const categories = useMemo(() => ["Semua", ...new Set(data?.products.map((product) => product.category) ?? [])], [data]);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    return data.products.filter((product) => {
      const matchesCategory = category === "Semua" || product.category === category;
      const term = query.toLowerCase();
      const matchesQuery = !term || product.name.toLowerCase().includes(term) || product.category.toLowerCase().includes(term);
      return matchesCategory && matchesQuery;
    });
  }, [category, data, query]);

  const cartItems = useMemo<CartLine[]>(() => {
    if (!data) return [];
    return Object.entries(cart)
      .map(([productId, qty]) => {
        const product = data.products.find((item) => item.id === productId);
        if (!product || qty <= 0) return null;
        return { product, qty, subtotal: qty * product.sellPrice };
      })
      .filter((value): value is CartLine => Boolean(value));
  }, [cart, data]);

  const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const invalidItem = cartItems.find((item) => item.qty > item.product.stock);

  if (!data) return null;

  const addToCart = (productId: string) => {
    setError(null);
    setSuccess(null);
    setCart((current) => ({ ...current, [productId]: (current[productId] ?? 0) + 1 }));
  };

  const updateQty = (productId: string, nextQty: number) => {
    setCart((current) => {
      if (nextQty <= 0) {
        const copy = { ...current };
        delete copy[productId];
        return copy;
      }
      return { ...current, [productId]: nextQty };
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
        items: cartItems.map((item) => ({ productId: item.product.id, qty: item.qty })),
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
    <div className="grid gap-6 xl:h-[calc(100vh-5.25rem)] xl:grid-cols-[1.6fr_1fr] xl:items-start">
      <div className="space-y-6 xl:flex xl:min-h-0 xl:flex-col xl:overflow-hidden">
        
        {/* HEADER / INFO SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white leading-tight">Kasir Retail</h2>
            <p className="text-sm text-slate-400 mt-1">Pilih barang dan atur pesanan pelanggan.</p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
            <span className="text-sm font-medium text-slate-400">Total Pembelian:</span>
            <span className="text-xl font-bold text-white">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* SEARCH & FILTER (Cleaner) */}
        <div className="flex flex-col lg:flex-row gap-3 flex-shrink-0">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 -mt-[0.5px] text-slate-400 stroke-[1.5] pointer-events-none" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama barang atau kategori..."
              className="h-11 w-full rounded-xl border-white/10 bg-black/20 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus-visible:border-red-500 focus-visible:ring-1 focus-visible:ring-red-500/50 transition-all shadow-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
            {categories.map((item) => (
              <Button
                key={item}
                type="button"
                variant={category === item ? "default" : "outline"}
                onClick={() => setCategory(item)}
                className={cn(
                  "h-11 px-4 rounded-xl whitespace-nowrap",
                  category === item ? "bg-red-500/20 text-red-400 border-red-500/30 shadow-none glow-none" : "border-white/10 bg-white/5 text-slate-300"
                )}
              >
                {item}
              </Button>
            ))}
          </div>
        </div>

        {/* PRODUCT GRID */}
        <section className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto pr-2">
          {filteredProducts.map((product) => {
            const isLow = product.stock <= product.minimumStock;
            return (
              <Card key={product.id} className="h-full flex flex-col group glass-card-hover border-white/5 bg-white/5 p-4 rounded-xl">
                <div className="flex-1 min-w-0 mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{product.category}</p>
                  <h3 className="line-clamp-2 text-sm font-semibold text-white mb-1.5">{product.name}</h3>
                  <p className="text-lg font-bold text-white">{formatCurrency(product.sellPrice)}</p>
                </div>

                <div className="flex items-center justify-between text-xs mb-3 border-t border-white/5 pt-3">
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold tracking-wider", isLow ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400")}>
                    Stok: {product.stock}
                  </span>
                  <span className="text-slate-500">Min {product.minimumStock}</span>
                </div>

                <Button
                  className="w-full h-10 text-xs shadow-none border-white/10 bg-white/10 text-white hover:bg-white/20 transition-all"
                  onClick={() => addToCart(product.id)}
                  disabled={product.stock === 0}
                >
                  <Plus className="size-3 mr-2" />
                  {product.stock === 0 ? "Habis" : "Tambah"}
                </Button>
              </Card>
            );
          })}
        </section>
      </div>

      {/* CART SIDEBAR (Clean & Spaced) */}
      <Card className="flex flex-col h-[calc(100vh-5.25rem)] xl:h-full border-white/5 bg-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5 shrink-0 flex justify-between items-center bg-black/20">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <ShoppingCart className="size-5 text-slate-300" /> Keranjang
          </div>
          <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-300">
            {cartItems.reduce((acc, i) => acc + i.qty, 0)} Item
          </Badge>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          {/* CART LIST */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
            {cartItems.length ? (
              cartItems.map((item) => (
                <div key={item.product.id} className="flex flex-col gap-3 rounded-xl border border-white/5 bg-black/20 p-4 transition-colors hover:bg-white/5">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{item.product.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatCurrency(item.product.sellPrice)} / ea</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => updateQty(item.product.id, 0)} className="h-7 w-7 text-slate-500 hover:text-red-400">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300" onClick={() => updateQty(item.product.id, item.qty - 1)}>
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-6 text-center text-xs font-bold text-white">{item.qty}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300" onClick={() => updateQty(item.product.id, item.qty + 1)}>
                        <Plus className="size-3" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{formatCurrency(item.subtotal)}</p>
                      {item.qty > item.product.stock && (
                        <p className="text-[10px] text-red-400 mt-0.5 font-medium">Melebihi stok ({item.product.stock})</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-10">
                <ShoppingCart className="size-8 mb-3 opacity-20" />
                <p className="text-sm font-medium">Keranjang kosong</p>
              </div>
            )}
          </div>

          {/* CHECKOUT SECTION */}
          <div className="shrink-0 p-5 border-t border-white/5 bg-black/40 space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Metode Pembayaran</p>
              <div className="flex gap-2">
                {data.settings.enabledPaymentMethods.map((method) => (
                  <Button
                    key={method}
                    type="button"
                    variant={paymentMethod === method ? "default" : "outline"}
                    onClick={() => setPaymentMethod(method)}
                    className={cn(
                      "flex-1 text-xs h-10 rounded-xl",
                      paymentMethod === method ? "bg-white/20 text-white border-white/30" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                    )}
                  >
                    {method}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400 font-medium text-sm">Total Bayar</span>
              <span className="text-2xl font-black text-white">{formatCurrency(total)}</span>
            </div>

            <Button
              size="lg"
              className="w-full h-14 text-base rounded-xl glow-red bg-red-600 hover:bg-red-500"
              onClick={handleCheckout}
              disabled={isSubmitting || isMutating || !cartItems.length || Boolean(invalidItem)}
            >
              {isSubmitting ? "Memproses..." : "Checkout Sekarang"}
            </Button>

            {error && <p className="text-xs text-red-400 text-center font-medium bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
            {success && <p className="text-xs text-emerald-400 text-center font-medium bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">{success}</p>}
          </div>
        </div>
      </Card>
    </div>
  );
}
