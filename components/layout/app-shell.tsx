"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, initials } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";

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

  return (
    <div className="flex min-h-screen bg-transparent text-slate-200">
      {/* 1. SIDEBAR (left, glass style) */}
      <aside className="hidden w-56 flex-col justify-between glass-panel border-y-0 border-l-0 border-r border-white/5 md:flex sticky top-0 h-screen z-40 shrink-0">
        <div>
          <div className="flex items-center gap-3 px-6 py-8">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-[0_0_15px_rgba(229,57,53,0.4)]">
              <Store className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">{data?.profile.name ?? "Chicken Mart"}</h1>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">POS System</p>
            </div>
          </div>

          <nav className="px-4 mt-2 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                    active
                      ? "bg-red-500/10 text-red-500 border-red-500/20 border"
                      : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent",
                  )}
                >
                  <Icon className={cn("size-5", active ? "text-red-500" : "text-slate-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 mb-4">
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white border border-white/10">
              {initials(session?.fullName ?? "PT")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session?.fullName ?? "Pemilik Toko"}</p>
              <p className="text-xs text-slate-400 truncate">Admin</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
              className="rounded-full text-slate-400 hover:bg-white/10 hover:text-white"
              title="Keluar"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        {/* 2. HEADER */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-6 glass-panel border-x-0 border-t-0 rounded-none bg-black/20">
          <div>
            <h2 className="text-2xl font-bold text-white">Hi, {session?.fullName?.split(' ')[0] ?? "Apiip"} 👋</h2>
            <p className="text-sm text-slate-400 mt-1">Pantau aktivitas toko hari ini</p>
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

        <main className="flex-1 p-4 sm:p-8 pb-24 md:pb-8">
          {isReady ? children : null}
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
