"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ShoppingCart,
  Package,
  X,
  ChevronRight,
} from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "./product-card";
import { CartItem } from "./cart-item";
import { useData } from "@/components/providers/data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PaymentMethod, Product, BootstrapData } from "@/lib/types";
import { cn, formatCurrency, getInvoiceDisplay } from "@/lib/utils";
import { toast } from "sonner";
import React, { memo } from "react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

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

  const total = useMemo(() => cartItems.reduce((sum, item) => sum + item.subtotal, 0), [cartItems]);
  const totalItems = useMemo(() => cartItems.reduce((acc, i) => acc + i.qty, 0), [cartItems]);
  const invalidItem = useMemo(() => cartItems.find((item) => item.qty > item.product.stock), [cartItems]);

  const addToCart = useCallback((productId: string) => {
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

  const handleCheckout = useCallback(async () => {
    if (!cartItems.length) {
      toast.error("Keranjang Kosong", { description: "Pilih minimal satu produk untuk checkout." });
      return;
    }
    if (invalidItem) {
      toast.error("Stok Tidak Cukup", { description: `Stok ${invalidItem.product.name} tidak cukup.` });
      return;
    }
    if (paymentMethod === "Hutang" && !customerName.trim()) {
      toast.error("Nama Pelanggan Wajib", { description: "Nama pelanggan harus diisi untuk transaksi Hutang." });
      return;
    }
    
    setIsSubmitting(true);
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
      toast.success("Checkout Berhasil", {
        description: `Invoice ${getInvoiceDisplay(transaction)} - Total ${formatCurrency(transaction.total)} telah dicatat.`,
        duration: 3000,
      });
      // Auto-close on mobile only
      if (window.matchMedia("(max-width: 1023px)").matches) {
        setIsCartOpen(false);
      }
    } catch (err) {
      toast.error("Checkout Gagal", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan saat memproses transaksi.",
        duration: 4500,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [cartItems, invalidItem, paymentMethod, customerName, createTransaction, customerPhone, dueDate]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    
    // Throttled check for infinite scroll
    if (scrollBottom < 400 && visibleCount < filteredProducts.length) {
      setVisibleCount((prev) => prev + 24);
    }
  }, [visibleCount, filteredProducts.length]);

  // POS State Object for Sub-components
  const posState = useMemo(() => ({
    isCartOpen,
    setIsCartOpen,
    totalItems,
    total,
    cartItems,
    updateQty,
    paymentMethod,
    setPaymentMethod,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    dueDate,
    setDueDate,
    handleCheckout,
    isSubmitting,
    isMutating,
    invalidItem,
    data
  }), [
    isCartOpen, totalItems, total, cartItems, updateQty, 
    paymentMethod, customerName, customerPhone, dueDate, 
    handleCheckout, isSubmitting, isMutating, invalidItem, data
  ]);



  return (
    <div className="relative min-h-full p-0 flex flex-col overflow-visible xl:overflow-hidden">
      {/* LOCAL DECORATIVE BACKGROUND - Optimized: Reduced blur and size */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-12 -right-12 size-[300px] bg-red-600/5 rounded-full opacity-40" />
      </div>

      <div className="relative z-10 flex flex-col xl:flex-row xl:gap-8 lg:gap-6 gap-4 h-auto xl:h-full min-h-0 px-4 sm:px-0">
        {/* LEFT: PRODUCT SECTION */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 xl:space-y-6 space-y-4">
          <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Kasir Retail</h2>
              <p className="text-sm text-slate-400 mt-1">Pilih barang dan atur pesanan pelanggan.</p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl backdrop-blur-sm">
              <span className="text-sm font-medium text-slate-400">Total:</span>
              <span className="text-xl font-bold text-white leading-none">{formatCurrency(total)}</span>
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
            className="flex-1 min-h-0 overflow-visible xl:overflow-y-auto pr-2 custom-scrollbar pb-32 xl:pb-8"
            onScroll={handleScroll}
          >
            {filteredProducts.length > 0 ? (
              <div className="grid auto-rows-fr xl:gap-4 lg:gap-4 gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
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

        {/* DESKTOP SIDEBAR CART (>= 1024px) */}
        <aside className="hidden lg:flex w-full xl:w-[400px] shrink-0 z-30">
            <div className="flex flex-col h-full border border-white/10 lg:border-white/5 bg-[#0f0f11] rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
              <div className="p-5 border-b border-white/5 shrink-0 flex justify-between items-center bg-black/20">
                <div className="flex items-center gap-2 text-white font-bold text-lg">
                  <ShoppingCart className="size-5 text-slate-300" /> Keranjang
                </div>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-300 font-bold">
                  {totalItems} Item
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

                <AnimatePresence mode="wait">
                  {paymentMethod === "Hutang" && (
                    <motion.div 
                      key="hutang-form-desktop"
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
                  <span className="text-2xl font-black text-white leading-none">{formatCurrency(total)}</span>
                </div>

                <Button
                  size="lg"
                  className="w-full h-14 text-base rounded-xl glow-red bg-red-600 hover:bg-red-500 shadow-lg active:scale-[0.98] transition-all font-bold"
                  onClick={handleCheckout}
                  disabled={isSubmitting || isMutating || !cartItems.length || Boolean(invalidItem)}
                >
                  {isSubmitting ? "Memproses..." : "Checkout Sekarang"}
                </Button>
              </div>
            </div>
          </aside>
      </div>

      <MobilePOSUI {...posState} />
    </div>
  );
}

/**
 * 1. MOBILE FLOATING PILL
 * Only rerenders when total items/price change.
 */
const MobileFloatingPill = memo(({ totalItems, total, onOpen }: any) => {
  return (
    <div className="lg:hidden fixed bottom-8 right-6 md:right-10 lg:right-12 w-[calc(100%-3rem)] sm:w-[420px] z-[9998] pointer-events-auto">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: totalItems > 0 ? 0 : 100, opacity: totalItems > 0 ? 1 : 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <Button
          className="w-full h-16 rounded-full shadow-[0_20px_50px_rgba(220,38,38,0.4)] bg-[#121214]/90 hover:bg-[#1a1a1c] text-white border border-white/10 glow-red flex items-center justify-between px-6 backdrop-blur-2xl group overflow-hidden"
          onClick={onOpen}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-red-600 p-2 rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              <ShoppingCart className="size-5" />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-0.5">Item</span>
              <span className="font-bold text-lg">{totalItems} Produk</span>
            </div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="flex flex-col items-end leading-none">
              <span className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-0.5">Total</span>
              <span className="font-black text-xl text-red-500 tracking-tighter">{formatCurrency(total)}</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-1 text-sm font-black text-white/80 group-hover:text-white transition-colors">
              <span>LIHAT</span>
              <ChevronRight className="size-4" />
            </div>
          </div>
        </Button>
      </motion.div>
    </div>
  );
});

MobileFloatingPill.displayName = "MobileFloatingPill";

/**
 * 2. MOBILE CART DRAWER
 * Only active when open. Manages its own body scroll lock.
 */
const MobileCartDrawer = memo(({ 
  isOpen, 
  onClose, 
  cartItems, 
  updateQty,
  paymentMethod,
  setPaymentMethod,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  dueDate,
  setDueDate,
  handleCheckout,
  total,
  isSubmitting,
  isMutating,
  invalidItem,
  data
}: any) => {
  // Dedicated Scroll Lock for Drawer
  useLayoutEffect(() => {
    if (!isOpen) return;
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    if (isMobile) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "var(--removed-body-scroll-bar-size)";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="mobile-cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9990] lg:hidden"
          />

          <motion.div
            key="mobile-cart-drawer"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 h-[90vh] z-[9999] flex flex-col bg-[#0a0a0c] rounded-t-[32px] border-t border-white/10 overflow-hidden shadow-[0_-10px_50px_rgba(0,0,0,1)] lg:hidden"
          >
            <div className="p-5 border-b border-white/5 shrink-0 flex justify-between items-center bg-black/40">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <ShoppingCart className="size-5 text-slate-300" /> Keranjang Pesanan
              </div>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white" onClick={onClose}>
                <X className="size-6" />
              </Button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {cartItems.length ? (
                cartItems.map((item: any) => (
                  <CartItem key={item.product.id} product={item.product} qty={item.qty} subtotal={item.subtotal} onUpdateQty={updateQty} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-20">
                  <ShoppingCart className="size-12 mb-4 opacity-10" />
                  <p className="text-sm font-medium">Keranjang masih kosong</p>
                </div>
              )}
            </div>

            <div className="shrink-0 p-5 border-t border-white/10 bg-black/40 space-y-4">
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Metode Pembayaran</p>
                <div className="flex gap-2">
                  {data.settings.enabledPaymentMethods.map((method: string) => (
                    <Button
                      key={method}
                      variant={paymentMethod === method ? "default" : "outline"}
                      onClick={() => setPaymentMethod(method)}
                      className={cn(
                        "flex-1 text-xs h-12 rounded-xl transition-all duration-300 font-bold",
                        paymentMethod === method ? "bg-red-600 text-white border-red-500/50 shadow-lg" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                      )}
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>

              {paymentMethod === "Hutang" && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="overflow-hidden">
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nama Pelanggan <span className="text-red-500">*</span></label>
                      <Input value={customerName} onChange={(e: any) => setCustomerName(e.target.value)} placeholder="Ketik nama pelanggan..." className="h-12 rounded-xl bg-black/40 border-white/10 text-white text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">WhatsApp</label>
                        <Input value={customerPhone} onChange={(e: any) => setCustomerPhone(e.target.value)} placeholder="08..." className="h-12 rounded-xl bg-black/40 border-white/10 text-white text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Jatuh Tempo</label>
                        <Input type="date" value={dueDate} onChange={(e: any) => setDueDate(e.target.value)} className="h-12 rounded-xl bg-black/40 border-white/10 text-white text-sm block w-full [color-scheme:dark]" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="shrink-0 p-5 pb-10 border-t border-white/10 bg-black/60 space-y-4 mb-safe">
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">Total Bayar</span>
                <span className="text-3xl font-black text-white tracking-tighter">{formatCurrency(total)}</span>
              </div>
              <Button
                size="lg"
                className="w-full h-16 text-lg font-black rounded-2xl glow-red bg-red-600 hover:bg-red-500 shadow-lg transition-all border border-red-500/50"
                onClick={handleCheckout}
                disabled={isSubmitting || isMutating || !cartItems.length || Boolean(invalidItem)}
              >
                {isSubmitting ? "MEMPROSES..." : "CHECKOUT SEKARANG"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

MobileCartDrawer.displayName = "MobileCartDrawer";

/**
 * 3. STABLE MOBILE POS UI ROOT
 */
const MobilePOSUI = memo((props: any) => {
  const onOpen = useCallback(() => props.setIsCartOpen(true), [props.setIsCartOpen]);
  const onClose = useCallback(() => props.setIsCartOpen(false), [props.setIsCartOpen]);

  return createPortal(
    <div id="mobile-pos-portal-root" className="contents">
      <MobileFloatingPill 
        totalItems={props.totalItems} 
        total={props.total} 
        onOpen={onOpen} 
      />
      <MobileCartDrawer 
        isOpen={props.isCartOpen} 
        onClose={onClose} 
        {...props} 
      />
    </div>,
    document.body
  );
});

MobilePOSUI.displayName = "MobilePOSUI";
