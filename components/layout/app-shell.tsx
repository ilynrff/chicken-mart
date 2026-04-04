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
    <div className="app-shell">
      <header className="panel-surface hero-pattern bg-hero-grid sticky top-4 z-30 mb-6 overflow-hidden border-white/80 bg-white/90">
        <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-[26px] bg-gradient-to-br from-primary via-red-500 to-chart-2 text-primary-foreground shadow-lg ring-1 ring-red-200/60">
              <Store className="size-7" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">Workspace aktif</p>
              <h1 className="truncate text-2xl font-black leading-tight">{data?.profile.name ?? "Chicken Mart"}</h1>
              <p className="truncate text-sm text-muted-foreground">
                {data?.profile.address ?? "Memuat alamat toko..."}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <div className="hidden rounded-2xl bg-secondary/90 px-4 py-2 text-right sm:block">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary/70">Operator</p>
              <p className="text-sm font-semibold">{session?.fullName ?? "Pemilik Toko"}</p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
              {initials(session?.fullName ?? "PT")}
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
              className="rounded-2xl"
            >
              <LogOut className="size-4" />
              Keluar
            </Button>
          </div>
        </div>

        <nav className="hidden border-t border-border/70 px-4 py-3 md:block">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="pb-6">{isReady ? children : null}</main>

      <nav className="panel-surface fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 justify-between gap-1 px-2 py-2 md:hidden">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
