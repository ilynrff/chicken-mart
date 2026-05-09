"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ShoppingCart,
  Package,
  X,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "./product-card";
import { CartItem } from "./cart-item";
import { useData } from "@/components/providers/data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PaymentMethod, Product, BootstrapData } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type CartLine = {
  product: Product;
  qty: number;
  subtotal: number;
};

interface KasirClientProps {
  initialData: BootstrapData;
}

export function KasirClient({ initialData }: KasirClientProps) {
  const { createTransaction, isMutating } = useData();
  
  // Use initialData as base, but prefer live data if available from provider
  // Actually, since we're in a page that just loaded, initialData is our current truth.
  const { data: liveData } = useData();
  const data = liveData || initialData;

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Tunai");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Windowed rendering
  const [visibleCount, setVisibleCount] = useState(24);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset windowing on filter change
  useEffect(() => {
    setVisibleCount(24);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [category, debouncedQuery]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!categoriesRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - categoriesRef.current.offsetLeft);
    setScrollLeft(categoriesRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !categoriesRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoriesRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    categoriesRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (categoriesRef.current) {
      categoriesRef.current.scrollLeft += e.deltaY;
    }
  };

  const categories = useMemo(() => ["Semua", ...new Set(data.products.map((p) => p.category))], [data.products]);

  const filteredProducts = useMemo(() => {
    return data.products.filter((product) => {
      const matchesCategory = category === "Semua" || product.category === category;
      const term = debouncedQuery.toLowerCase();
      const matchesQuery = !term || product.name.toLowerCase().includes(term) || product.category.toLowerCase().includes(term);
      return matchesCategory && matchesQuery;
    });
  }, [category, data.products, debouncedQuery]);

  const cartItems = useMemo<CartLine[]>(() => {
    return Object.entries(cart)
      .map(([productId, qty]) => {
        const product = data.products.find((item) => item.id === productId);
        if (!product || qty <= 0) return null;
        return { product, qty, subtotal: qty * product.sellPrice };
      })
      .filter((value): value is CartLine => Boolean(value));
  }, [cart, data.products]);

  const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const invalidItem = cartItems.find((item) => item.qty > item.product.stock);

  const addToCart = useCallback((productId: string) => {
    setError(null);
    setSuccess(null);
    setCart((current) => ({ ...current, [productId]: (current[productId] ?? 0) + 1 }));
  }, []);

  const updateQty = useCallback((productId: string, nextQty: number) => {
    setCart((current) => {
      if (nextQty <= 0) {
        const copy = { ...current };
        delete copy[productId];
        return copy;
      }
      return { ...current, [productId]: nextQty };
    });
  }, []);

  const handleCheckout = async () => {
    if (!cartItems.length) {
      setError("Keranjang masih kosong.");
      return;
    }
    if (invalidItem) {
      setError(`Stok ${invalidItem.product.name} tidak cukup.`);
      return;
    }
    if (paymentMethod === "Hutang" && !customerName.trim()) {
      setError("Nama pelanggan wajib diisi untuk Hutang.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
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
      setSuccess(`Checkout berhasil. Total ${formatCurrency(transaction.total)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout gagal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 400) {
      if (visibleCount < filteredProducts.length) {
        setVisibleCount((prev) => prev + 24);
      }
    }
  };

  return (
    <div className="relative min-h-full p-0 flex flex-col">
      {/* LOCAL DECORATIVE BACKGROUND - Optimized: Reduced blur and size */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-12 -right-12 size-[300px] bg-red-600/5 rounded-full opacity-40" />
      </div>

      <div className="relative z-10 flex flex-col xl:flex-row gap-8 h-full min-h-0">
        {/* LEFT: PRODUCT SECTION */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 space-y-6">
          <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Kasir Retail</h2>
              <p className="text-sm text-slate-400 mt-1">Pilih barang dan atur pesanan pelanggan.</p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl backdrop-blur-sm">
              <span className="text-sm font-medium text-slate-400">Total:</span>
              <span className="text-xl font-bold text-white">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="shrink-0 space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
              <div className="relative group w-full lg:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari menu..."
                  className="h-10 w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/40 focus:bg-white/10 transition-all shadow-inner"
                />
              </div>

              <div className="relative flex-1 min-w-0 overflow-hidden">
                <div 
                  ref={categoriesRef}
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  className={cn(
                    "flex gap-2 overflow-x-auto hide-scrollbar py-1 px-2 select-none scroll-smooth",
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                  )}
                >
                  {categories.map((item) => (
                    <button
                      key={item}
                      onClick={() => setCategory(item)}
                      className={cn(
                        "h-9 px-5 rounded-full whitespace-nowrap text-xs font-bold uppercase tracking-wider transition-all duration-300 border",
                        category === item 
                          ? "bg-gradient-to-r from-red-600 to-red-500 text-white border-red-500/50 shadow-[0_4px_12px_rgba(220,38,38,0.3)] scale-105 z-10" 
                          : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div 
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar pb-8"
            onScroll={handleScroll}
          >
            {filteredProducts.length > 0 ? (
              <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.slice(0, visibleCount).map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAdd={addToCart} 
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="rounded-full bg-white/5 p-4 mb-3">
                  <Package className="size-6 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-white">Produk tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: CART SIDEBAR - Optimized: Reduced blur */}
        <aside className="w-full xl:w-[400px] shrink-0 z-30">
          <div className="flex flex-col h-full border border-white/5 bg-[#0f0f11] rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="p-5 border-b border-white/5 shrink-0 flex justify-between items-center bg-black/20">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <ShoppingCart className="size-5 text-slate-300" /> Keranjang
              </div>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-300">
                {cartItems.reduce((acc, i) => acc + i.qty, 0)} Item
              </Badge>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {cartItems.length ? (
                cartItems.map((item) => (
                  <CartItem 
                    key={item.product.id} 
                    product={item.product} 
                    qty={item.qty} 
                    subtotal={item.subtotal} 
                    onUpdateQty={updateQty} 
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-10">
                  <ShoppingCart className="size-8 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Keranjang kosong</p>
                </div>
              )}
            </div>

            <div className="shrink-0 p-5 border-t border-white/5 bg-black/20 space-y-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Metode Pembayaran</p>
                <div className="flex gap-2">
                  {data.settings.enabledPaymentMethods.map((method) => (
                    <Button
                      key={method}
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

              <AnimatePresence>
                {paymentMethod === "Hutang" && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pt-3 border-t border-white/5">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-medium">Nama Pelanggan <span className="text-red-400">*</span></label>
                        <Input 
                          value={customerName} 
                          onChange={e => setCustomerName(e.target.value)} 
                          placeholder="Wajib diisi"
                          className="h-10 rounded-lg bg-black/20 border-white/10 text-white text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-400 font-medium">No. WhatsApp</label>
                          <Input 
                            value={customerPhone} 
                            onChange={e => setCustomerPhone(e.target.value)} 
                            placeholder="Opsional"
                            className="h-10 rounded-lg bg-black/20 border-white/10 text-white text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-400 font-medium">Jatuh Tempo</label>
                          <Input 
                            type="date"
                            value={dueDate} 
                            onChange={e => setDueDate(e.target.value)} 
                            className="h-10 rounded-lg bg-black/20 border-white/10 text-white text-sm block w-full [color-scheme:dark]"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="shrink-0 p-5 pb-8 border-t border-white/5 bg-black/40 space-y-4">
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
          </div>
        </aside>
      </div>

      {/* FEEDBACK MESSAGES */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 pointer-events-none">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-500 text-white p-4 rounded-2xl shadow-2xl border border-red-400 flex items-center gap-3 pointer-events-auto mb-4"
            >
              <div className="size-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <X className="size-4" />
              </div>
              <p className="text-xs font-bold">{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-emerald-500 text-white p-4 rounded-2xl shadow-2xl border border-emerald-400 flex items-center gap-3 pointer-events-auto"
            >
              <div className="size-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <ChevronRight className="size-4 rotate-90" />
              </div>
              <p className="text-xs font-bold">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
