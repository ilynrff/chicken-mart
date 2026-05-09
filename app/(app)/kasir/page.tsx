"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CreditCard,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  Package,
  X,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

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
    if (paymentMethod === "Hutang" && !customerName.trim()) {
      setError("Nama pelanggan harus diisi untuk transaksi Hutang.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const transaction = await createTransaction({
        items: cartItems.map((item) => ({ productId: item.product.id, qty: item.qty })),
        paymentMethod,
        customerName: paymentMethod === "Hutang" ? customerName.trim() : undefined,
        customerPhone: paymentMethod === "Hutang" && customerPhone.trim() ? customerPhone.trim() : undefined,
        dueDate: paymentMethod === "Hutang" && dueDate ? dueDate : undefined,
      });
      setCart({});
      setCustomerName("");
      setCustomerPhone("");
      setDueDate("");
      setSuccess(`Checkout berhasil. Total transaksi ${formatCurrency(transaction.total)}.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Checkout gagal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-full p-0 sm:p-0">
      {/* 0. LOCAL DECORATIVE BACKGROUND (Subtle Accent) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 size-[500px] bg-red-600/5 blur-[120px] rounded-full opacity-60" />
      </div>

      <div className="relative z-10 flex flex-col xl:flex-row gap-8 h-[calc(100vh-160px)] min-h-0">
        {/* LEFT: PRODUCT SECTION (Independently Scrollable) */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 space-y-6">
          {/* HEADER / INFO SECTION */}
          <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white leading-tight tracking-tight">Kasir Retail</h2>
              <p className="text-sm text-slate-400 mt-1">Pilih barang dan atur pesanan pelanggan.</p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl backdrop-blur-sm">
              <span className="text-sm font-medium text-slate-400">Total Pembelian:</span>
              <span className="text-xl font-bold text-white">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* SEARCH & FILTER AREA */}
          <div className="shrink-0 space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
              <div className="relative group w-full lg:w-60 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari menu..."
                  className="h-10 w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/40 focus:bg-white/10 transition-all shadow-inner"
                />
              </div>

              <div className="relative flex-1 min-w-0">
                <div 
                  ref={scrollRef}
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  className={cn(
                    "flex gap-2 overflow-x-auto hide-scrollbar edge-fade-both py-1 px-4 select-none scroll-smooth",
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                  )}
                >
                  {categories.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategory(item)}
                      className={cn(
                        "h-9 px-5 rounded-full whitespace-nowrap text-xs font-bold uppercase tracking-wider transition-all duration-300 border",
                        category === item 
                          ? "bg-gradient-to-r from-red-600 to-red-500 text-white border-red-500/50 shadow-[0_4px_12px_rgba(220,38,38,0.3)] scale-105 z-10" 
                          : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 hover:border-white/20"
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* PRODUCT GRID (Scroll Container) */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar pb-8">
            {filteredProducts.length > 0 ? (
              <motion.div 
                layout
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.05 } }
                }}
                className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filteredProducts.map((product) => {
                  const isLow = product.stock <= product.minimumStock;
                  return (
                    <motion.div
                      key={product.id}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Card className="h-full flex flex-col group glass-card-hover border-white/5 bg-white/5 p-4 rounded-xl">
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
                          className="w-full h-10 text-xs shadow-none border-white/10 bg-white/10 text-white hover:bg-white/20 transition-all rounded-xl"
                          onClick={() => addToCart(product.id)}
                          disabled={product.stock === 0}
                        >
                          <Plus className="size-3 mr-2" />
                          {product.stock === 0 ? "Habis" : "Tambah"}
                        </Button>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className="rounded-full bg-white/5 p-4 mb-3 border border-white/10">
                  <Package className="size-6 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-white">Belum ada produk</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">Tambahkan produk baru di halaman Inventaris agar bisa melakukan transaksi.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: CART SIDEBAR (Sticky/Fixed) */}
        <aside className="w-full xl:w-[400px] xl:sticky xl:top-0 shrink-0 z-30">
          <Card className="flex flex-col h-[calc(100vh-160px)] border-white/5 bg-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
            {/* Header */}
            <div className="p-5 border-b border-white/5 shrink-0 flex justify-between items-center bg-black/20">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <ShoppingCart className="size-5 text-slate-300" /> Keranjang
              </div>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-300">
                {cartItems.reduce((acc, i) => acc + i.qty, 0)} Item
              </Badge>
            </div>

            {/* Cart List (Scrollable) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 custom-scrollbar">
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

            {/* PAYMENT & DEBT SECTION (Pinned below list) */}
            <div className="shrink-0 p-5 border-t border-white/5 bg-black/20 space-y-4">
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
                        "flex-1 text-xs h-10 rounded-xl transition-all duration-300",
                        paymentMethod === method ? "bg-white/20 text-white border-white/30" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                      )}
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>

              {/* HUTANG FORM SECTION (Animated) */}
              <div className={cn(
                "grid transition-all duration-300 ease-out",
                paymentMethod === "Hutang" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
              )}>
                <div className="overflow-hidden">
                  <div className={cn(
                    "space-y-3 pt-3 border-t border-white/5 transition-all duration-300 ease-out",
                    paymentMethod === "Hutang" ? "translate-y-0" : "translate-y-4"
                  )}>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-medium">Nama Pelanggan <span className="text-red-400">*</span></label>
                      <Input 
                        value={customerName} 
                        onChange={e => setCustomerName(e.target.value)} 
                        placeholder="Wajib diisi"
                        className="h-10 rounded-lg bg-black/20 border-white/10 text-white text-sm focus-visible:ring-red-500/50 focus-visible:border-red-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-medium">No. WhatsApp</label>
                        <Input 
                          value={customerPhone} 
                          onChange={e => setCustomerPhone(e.target.value)} 
                          placeholder="Opsional"
                          className="h-10 rounded-lg bg-black/20 border-white/10 text-white text-sm focus-visible:ring-red-500/50 focus-visible:border-red-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-medium">Jatuh Tempo</label>
                        <Input 
                          type="date"
                          value={dueDate} 
                          onChange={e => setDueDate(e.target.value)} 
                          className="h-10 rounded-lg bg-black/20 border-white/10 text-white text-sm focus-visible:ring-red-500/50 focus-visible:border-red-500 block w-full [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CHECKOUT FOOTER (Always Visible) */}
            <div className="shrink-0 p-5 pb-8 border-t border-white/5 bg-black/40 space-y-4 relative z-20">
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400 font-medium text-sm">Total Bayar</span>
                <span className="text-2xl font-black text-white">{formatCurrency(total)}</span>
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-base rounded-xl glow-red bg-red-600 hover:bg-red-500 shadow-lg active:scale-[0.98] transition-all"
                onClick={handleCheckout}
                disabled={isSubmitting || isMutating || !cartItems.length || Boolean(invalidItem)}
              >
                {isSubmitting ? "Memproses..." : "Checkout Sekarang"}
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      {/* FEEDBACK MESSAGES */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 pointer-events-none">
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-2xl shadow-2xl border border-red-400 flex items-center gap-3 animate-in slide-in-from-top duration-300 pointer-events-auto">
            <div className="size-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <X className="size-4" />
            </div>
            <p className="text-xs font-bold">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-2xl border border-emerald-400 flex items-center gap-3 animate-in slide-in-from-top duration-300 pointer-events-auto">
            <div className="size-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <ChevronRight className="size-4 rotate-90" />
            </div>
            <p className="text-xs font-bold">{success}</p>
          </div>
        )}
      </div>
    </div>
  );
}
