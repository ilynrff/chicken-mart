"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  ClipboardList,
  HandCoins,
  LayoutGrid,
  LogOut,
  Package2,
  ReceiptText,
  Settings2,
  Store,
  Plus,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, initials } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { PageTransition } from "@/components/layout/page-transition";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/kasir", label: "Kasir", icon: ReceiptText },
  { href: "/inventaris", label: "Inventaris", icon: Package2 },
  { href: "/hutang", label: "Hutang", icon: HandCoins },
  { href: "/laporan", label: "Laporan", icon: ClipboardList },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();
  const { data, isReady } = useData();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={cn("flex min-h-screen bg-transparent text-slate-200", pathname === "/kasir" && "xl:h-screen xl:overflow-hidden")}>
      {/* 1. SIDEBAR (left, glass style) */}
      <aside className={cn(
        "hidden flex-col justify-between glass-panel border-y-0 border-l-0 border-r border-white/5 sticky top-0 h-screen z-40 shrink-0 transition-all duration-300",
        "md:flex",
        isCollapsed ? "w-20" : "w-56"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-8">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-[0_0_15px_rgba(229,57,53,0.4)]">
              <Store className="size-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight text-white truncate">{data?.profile.name ?? "Chicken Mart"}</h1>
                <p className="text-[10px] font-bold text-red-500/80 uppercase tracking-widest leading-tight">POS System</p>
              </div>
            )}
          </div>

          <nav className="px-4 mt-2 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                    active
                      ? "bg-red-500/10 text-red-500 border-red-500/20 border"
                      : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent",
                    isCollapsed && "justify-center px-0"
                  )}
                >
                  <Icon className={cn("size-5", active ? "text-red-500" : "text-slate-400")} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 mb-4">
          <div className={cn("glass-card relative p-3 flex items-center gap-3", isCollapsed && "justify-center p-2")}>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white border border-white/10">
              {initials(session?.fullName ?? "PT")}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 pr-6">
                <p className="text-sm font-medium text-white truncate">{session?.fullName ?? "Pemilik Toko"}</p>
                <Button
                  variant="link"
                  size="none"
                  onClick={async () => {
                    await logout();
                    router.replace("/login");
                  }}
                  className="text-xs text-red-400 hover:text-red-300 p-0 h-auto"
                >
                  Logout
                </Button>
              </div>
            )}

            {/* Sidebar Toggle Button - Larger Area & Shifted Left */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "absolute z-50 hidden md:flex size-8 rounded-lg text-slate-500 hover:bg-white/10 hover:text-white transition-all",
                isCollapsed ? "inset-0 m-auto opacity-0 hover:opacity-100" : "right-2 top-1/2 -translate-y-1/2"
              )}
            >
              {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        {/* 2. HEADER */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-6 glass-panel border-x-0 border-t-0 rounded-none bg-black/20">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Hi, {session?.fullName?.split(' ')[0] ?? "Admin"} 👋</h2>
            <p className="text-sm text-slate-400 mt-1 opacity-80 italic">Have a nice day 😊 اَلْحَمْدُ للهِ جَزَاكُمُ اللهُ خَيْرًا</p>
          </div>

          <div className="flex items-center gap-4">
            <Button asChild className="hidden sm:flex rounded-xl bg-red-600 text-white hover:bg-red-500 glow-red border border-red-500/50 shadow-lg transition-all">
              <Link href="/kasir">
                <Plus className="mr-2 size-4" />
                Transaksi Baru
              </Link>
            </Button>
            <div className="md:hidden flex size-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white border border-white/10">
              {initials(session?.fullName ?? "PT")}
            </div>
          </div>
        </header>

        <main className={cn(
          "flex-1 p-4 sm:p-8 pb-24 md:pb-8 flex flex-col min-h-0",
          pathname === "/kasir" && "xl:h-[calc(100vh-100px)] xl:overflow-hidden sm:p-6 md:pb-6"
        )}>
          {isReady ? (
            data ? (
              <PageTransition>{children}</PageTransition>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center mt-12 glass-panel max-w-lg mx-auto w-full border border-white/10 rounded-2xl">
                <Store className="size-16 text-slate-600 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Gagal Memuat Data</h2>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  Terjadi masalah saat mengambil data dari server. Silakan coba muat ulang atau hubungi administrator jika masalah berlanjut.
                </p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/10"
                >
                  Muat Ulang Halaman
                </Button>
              </div>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="size-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
            </div>
          )}
        </main>

        {/* Mobile Navigation */}
        <nav className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 justify-between gap-1 glass-panel rounded-2xl p-2 md:hidden">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-red-500" : "text-slate-400 hover:text-white",
                )}
              >
                <div className={cn("p-1.5 rounded-lg", active && "bg-red-500/10 border-red-500/20 border")}>
                  <Icon className="size-5" />
                </div>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
